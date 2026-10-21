/**
 * 玄机命理排盘 · 中转服务（Cloudflare Worker）
 * ------------------------------------------------------------
 * 作用：把大模型 API Key 放在服务端，浏览器永不接触 Key。
 *      前端 BaseURL 填本 Worker 的 /v1，Key 栏填「访问码」即可。
 *
 * 部署（免费额度足够个人使用）：
 *   1) npm i -g wrangler && wrangler login
 *   2) powershell -File worker\extract-prompt.ps1   # 先抽取 Prompt 模板（生成 secrets/ 之外的本地文件）
 *   3) cd worker && wrangler deploy
 *   4) 配密钥（不要写进代码 / 不要提交）：
 *        wrangler secret put API_KEY          # 真实上游 Key，如 sk-xxx
 *        wrangler secret put ACCESS_CODES     # 自己定，逗号分隔多个，如 code-a,code-b
 *   5) wrangler tail 看日志
 *
 * 前端设置：
 *   BaseURL = https://<你的子域>.workers.dev/v1
 *   API Key = <你设的访问码>
 *   模型名   = deepseek-chat（或 ALLOWED_MODELS 里的任意一个）
 *   勾选「🎭 使用服务端 Prompt」后，18 维研判准则不再从浏览器发出
 */

import PROMPT_TEMPLATE from './prompt-template.json';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',            // 生产可改为你的站点域名
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Access-Code',
  'Access-Control-Max-Age': '86400'
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS_HEADERS)
  });
}
function oaiError(message, status, type) {
  return json({ error: { message, type: type || 'proxy_error', code: status } }, status || 400);
}

/* ---------- 轻量限流：按 IP 的每日计数（isolate 内存，重启清零/多实例不共享） ---------- */
const rl = new Map();
function rateLimit(env, ip) {
  const limit = parseInt(env.DAILY_LIMIT || '0', 10);
  if (!limit) return true;                       // 未配置 = 不限
  const day = new Date().toISOString().slice(0, 10);
  const key = day + '|' + ip;
  const hit = (rl.get(key) || 0) + 1;
  rl.set(key, hit);
  if (rl.size > 5000) {                          // 简单防内存膨胀
    for (const k of rl.keys()) { if (!k.startsWith(day)) rl.delete(k); }
  }
  return hit <= limit;
}

/* ---------- 访问码校验 ---------- */
function authOk(env, request) {
  const codes = String(env.ACCESS_CODES || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!codes.length) return { ok: false, reason: '服务端未配置 ACCESS_CODES，拒绝所有请求' };
  const h = request.headers;
  const bearer = (h.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const custom = (h.get('X-Access-Code') || '').trim();
  const token = custom || bearer;
  if (!token) return { ok: false, reason: '缺少访问码' };
  const hit = codes.some(c => c === token);
  return hit ? { ok: true } : { ok: false, reason: '访问码无效' };
}

function upstreamBase(env) {
  return String(env.UPSTREAM_BASE || 'https://api.deepseek.com/v1').replace(/\/+$/, '');
}

/* ---------- 请求体校验与净化 ---------- */
function sanitizeChat(body, env) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.messages)) {
    throw new Error('请求体必须包含 messages 数组');
  }
  const allow = String(env.ALLOWED_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
  const model = String(body.model || 'deepseek-chat');
  if (allow.length && !allow.includes(model)) {
    throw new Error('模型不在白名单内：' + model);
  }
  const out = {
    model,
    messages: body.messages.slice(0, 40).map(m => ({
      role: String(m.role || 'user'),
      content: String(m.content == null ? '' : m.content).slice(0, 120000)
    })),
    stream: !!body.stream
  };
  if (typeof body.temperature === 'number') out.temperature = Math.max(0, Math.min(2, body.temperature));
  const cap = parseInt(env.MAX_TOKENS_CAP || '0', 10);
  if (typeof body.max_tokens === 'number' && body.max_tokens > 0) {
    out.max_tokens = cap > 0 ? Math.min(body.max_tokens, cap) : body.max_tokens;
  } else if (cap > 0) {
    out.max_tokens = cap;
  }
  return out;
}

/* ---------- 转发（流式透传，不缓存、不落盘、不记内容） ---------- */
async function forward(env, payload, request) {
  const url = upstreamBase(env) + '/chat/completions';
  const upstream = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + env.API_KEY,
      'Accept': payload.stream ? 'text/event-stream' : 'application/json',
      'User-Agent': 'xuanji-mingli-proxy/1.0'
    },
    body: JSON.stringify(payload),
    cf: { cacheTtl: 0 }
  });

  if (!upstream.ok) {
    let detail = '';
    try { detail = (await upstream.text()).slice(0, 400); } catch (e) {}
    return new Response(
      JSON.stringify({ error: { message: '上游返回 HTTP ' + upstream.status + (detail ? '：' + detail : ''), code: upstream.status } }),
      { status: upstream.status, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS_HEADERS) }
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: Object.assign({
      'Content-Type': payload.stream ? 'text/event-stream; charset=utf-8' : 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no'
    }, CORS_HEADERS)
  });
}

/* ---------- 服务端 Prompt 注入：研判准则与知识库框架永不下发浏览器 ---------- */
function buildDivine(body) {
  const root = PROMPT_TEMPLATE;
  if (!root || !root.schools || !Object.keys(root.schools).length) {
    throw new Error('服务端未载入 Prompt 模板（请先运行 worker/extract-prompt.ps1 后重新部署）');
  }
  const n = parseInt(body.school, 10);
  const idx = (isFinite(n) && n >= 0 && n <= 4) ? n : 0;
  const sch = root.schools[String(idx)];
  if (!sch || !sch.template) throw new Error('模板缺少该流派：' + body.school);

  const knowledge = String(body.knowledge || '');
  if (knowledge.length < 50) throw new Error('knowledge 过短，拒绝生成（前端可能未完成排盘）');

  const withZiwei = !!body.withZiwei;
  let system = sch.template.split('{{KNOWLEDGE}}').join(knowledge.slice(0, 60000));
  system = system.split('{{ZW_BLOCK}}').join(withZiwei ? String(root.zwBlock || '') : '');

  const basic = String(body.basic || '').slice(0, 4000);
  const chart = typeof body.chart === 'string' ? body.chart : JSON.stringify(body.chart || {});
  let user = '【基础信息（确认本盘身份，勿与它盘混淆）】\n' + basic +
             '\n\n【命盘数据】\n' + chart.slice(0, 60000);
  if (withZiwei) {
    const zwRef = String(body.zwRef || '');
    const zwGuide = String(body.zwGuide || '');
    if (zwRef) user += '\n\n' + zwRef.slice(0, 8000) + '\n\n' + zwGuide.slice(0, 8000);
  }

  body.messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
  body.stream = true;
  return body;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (path === '/health') return json({ ok: true, service: 'xuanji-mingli-proxy' });

    // 只放行白名单路径，避免被当成通用代理
    const isChat = path === '/v1/chat/completions' || path === '/chat/completions';
    const isModels = path === '/v1/models';
    const isDivine = path === '/v1/divine';
    if (!isChat && !isModels && !isDivine) return oaiError('未知路径：' + path + '（可用：/v1/chat/completions、/v1/models、/v1/divine）', 404);

    const auth = authOk(env, request);
    if (!auth.ok) return oaiError(auth.reason, 401, 'auth_error');

    if (!env.API_KEY) return oaiError('服务端未配置 API_KEY', 500, 'config_error');

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!rateLimit(env, ip)) return oaiError('请求过于频繁：已达当日额度上限', 429, 'rate_limited');

    if (isModels) {
      const r = await fetch(upstreamBase(env) + '/models', {
        headers: { 'Authorization': 'Bearer ' + env.API_KEY }
      });
      return new Response(r.body, {
        status: r.status,
        headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS_HEADERS)
      });
    }

    if (request.method !== 'POST') return oaiError('该路径仅支持 POST', 405);

    let body;
    try { body = await request.json(); } catch (e) { return oaiError('请求体不是合法 JSON', 400); }

    // 服务端注入 Prompt 的模式：前端只发命盘事实与知识库片段，研判准则永不下发
    let bodyForChat = body;
    if (isDivine) {
      try { bodyForChat = buildDivine(body); }
      catch (e) { return oaiError(e.message, 400, 'template_error'); }
    }

    let payload;
    try { payload = sanitizeChat(bodyForChat, env); } catch (e) { return oaiError(e.message, 400); }

    try {
      return await forward(env, payload, request);
    } catch (e) {
      return oaiError('中转层异常：' + (e && e.message || e), 502, 'proxy_exception');
    }
  }
};
