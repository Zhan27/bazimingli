# 中转服务（Cloudflare Worker）

**解决什么**：把 API Key **和** 18 维 Prompt 研判准则都移到服务端。浏览器里既看不到 Key，也拿不到 Prompt。

前端零改动适配 —— 对一个普通 OpenAI 兼容接口，它就是一个兼容接口；开启「🎭 使用服务端 Prompt」后，请求改走 `/v1/divine`。

---

## 三层能力

| 层 | 端点 | 保护了什么 | 前端改动 |
|---|---|---|---|
| ① Key 代理 | `/v1/chat/completions` | **API Key** 永不下发浏览器 | 无（BaseURL 指向 Worker、Key 栏填访问码） |
| ② Prompt 注入 | `/v1/divine` | **18 维研判准则 / 5 流派人格 / 评分规则 / 命格原型** 由服务端拼装 | 勾一个复选框 |
| ③ 精简发布 | `build-thin.ps1` | **把 Prompt 从发布版 HTML 里物理删除** | 产出 `dist/index.html` |

---

## 部署（5 分钟）

```bash
npm i -g wrangler
wrangler login
```

**第一步：抽取 Prompt 模板**（从源码自动抽，零手工、零漂移）

```powershell
powershell -ExecutionPolicy Bypass -File worker\extract-prompt.ps1
```

产出 `worker/prompt-template.json`（约 52 KB）。脚本内置**往返校验**：用模板还原出的 system 必须与原始输出逐字节相同，5 流派 × 开关紫微 = 10 组全过才会写文件。此文件已在 `.gitignore` 中，**不会进仓库**。

**第二步：部署**

```bash
cd worker
wrangler deploy
```

模板随 worker 一起打包（esbuild 会把 JSON 内联进 bundle），所以不需要 `wrangler secret`。

**第三步：配密钥**

```bash
wrangler secret put API_KEY        # 真实上游 Key，例：sk-xxxx
wrangler secret put ACCESS_CODES   # 自定访问码，逗号分隔：code-a,code-b
wrangler tail
```

`[vars]` 里可调（见 `wrangler.toml`）：

| 变量 | 说明 | 默认 |
|---|---|---|
| `UPSTREAM_BASE` | 上游地址，不带 `/chat/completions` | `https://api.deepseek.com/v1` |
| `DAILY_LIMIT` | 每访问码及每IP的isolate内每日额度；0/无效值回退80 | `80` |
| `ALLOWED_ORIGINS` | 精确Origin白名单，逗号分隔；缺省拒绝带Origin的浏览器请求 | `https://zhan27.github.io` |
| `ALLOWED_MODELS` | 模型白名单，逗号分隔 | `deepseek-chat` |
| `MAX_BODY_BYTES` | UTF-8请求体字节上限（含分块读取），最大1 MiB | `131072` |
| `UPSTREAM_TIMEOUT_MS` | 上游请求及流式响应总时长，最大300秒 | `120000` |
| `MAX_TOKENS_CAP` | 单次 max_tokens 硬上限 | `8192` |

### 5.19.1边界与兼容性

先修改 `ALLOWED_ORIGINS` 为实际网页的Origin（协议、主机、端口，不含路径）。默认允许本项目Pages域名；本地file页面可能发送 `Origin: null`，默认拒绝。只有明确接受其较宽来源范围才加入字面值 `null`，也可使用本地HTTP站点并允许其精确Origin。无Origin的命令行客户端仍需访问码；CORS不能替代身份验证。

请求必须是JSON；最多40条system/user/assistant字符串消息，超限明确拒绝，不静默截断聊天记录。未配置模型回退deepseek-chat，`/v1/models`只返回白名单。max_tokens必须是正整数并受上限约束；总响应还有4 MiB上限。上游地址只允许HTTPS，不跟随重定向。错误返回固定提示和类型，不回显上游响应正文或原始异常；所有响应禁用缓存。总时长限制覆盖流式传输，客户端取消会向上游传递取消信号，不自动付费重试。

每日额度是**单个Worker isolate内尽力限制**：访问码跨IP共享桶，同时限制IP；每日UTC零点过期，最多4096桶，满后拒绝新增。部署、多实例和重启仍可能重置或分散计数。严格全局额度需要Cloudflare平台限流或Durable Objects；不能把内存计数当成全局账单上限。模型列表与无效请求也计入额度。

本仓库修改不等于已部署服务更新；需要维护者按配置重新部署。`npm test`中的Worker测试使用虚构访问码和模拟上游，不发送收费模型请求。

5.20的普通聊天路由支持转发`response_format: json_object`及有界内联`json_schema`，以便保留前端的结构化请求。Schema最多32768字符、嵌套14层，不接受`$ref`/`$dynamicRef`；模型仍需实际支持该格式。旧版`/v1/divine`模板流程仍为全量Markdown，JSON或局部生成请在前端关闭服务端Prompt模式。更新此能力需要重新部署Worker。

---

## 前端怎么填

「🤖 AI 深度解读设置」：

```
BaseURL  = https://xuanji-mingli-proxy.<你的子域>.workers.dev/v1
API Key  = <你设的 ACCESS_CODES 里的任意一个>
模型名   = deepseek-chat
☑ 🎭 使用服务端 Prompt
```

点「测试连接」应返回 ✅。此时开 DevTools 看 Network：既没有真实 Key，也没有 `system` 字段。

---

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 健康检查，免鉴权 |
| POST | `/v1/chat/completions` | 通用代理，OpenAI 兼容，`stream:true` 透传 |
| GET | `/v1/models` | 鉴权后只列出配置允许的模型，不访问上游 |
| POST | `/v1/divine` | **服务端注入 Prompt**：只收命盘事实与知识库片段 |

`/v1/divine` 请求体：

```json
{
  "school": 0,            // 0~4 流派
  "withZiwei": true,      // 是否带紫微互参块
  "knowledge": "…",       // aiBuildKnowledge() 的输出
  "basic": "…",           // aiBasicInfo() 的输出
  "chart": "{…}",         // aiBuildChart() 的 JSON 字符串
  "zwRef": "…",           // 可选，紫微参考数据
  "zwGuide": "…",         // 可选，紫微互参指引
  "max_tokens": 8000
}
```

Worker 用服务端模板拼出 `system`，再拼 `user`，然后转发上游。**`system` 全文不下行。**

鉴权：`Authorization: Bearer <访问码>` 或 `X-Access-Code: <访问码>`。

---

## 一致性校验

```bash
node worker\verify-prompt.mjs _gt.json
```

从 `worker.js` 里真实取出 `buildDivine()` 执行（不是测试里重写一份实现），与浏览器 `aiBuildSchoolPrompt()` 的原始输出比对。上一轮实测：

```
· 校验盘面 : 1976-02-29 酉时（与抽取模板时用的盘不同）
✓ 全部通过：20 项逐字节一致（5 流派 × 开关紫微 × system/user）
```

用**另一张命盘**校验，是为了证明模板与具体盘面无关，不是把某次输出硬编码了一份。

---

## 精简发布版（真正把 Prompt 从 JSON 里删掉）

```powershell
powershell -ExecutionPolicy Bypass -File worker\build-thin.ps1
```

产出 `dist/index.html`：剥离 `aiBuildSchool`（5 流派人格，5,974 字符）与 `aiBuildSchoolPrompt`（研判准则，4,623 字符），强制 `divine:true`，移除「提取 Prompt」按钮。构建时校验 8 项敏感标记必须全部消失，并做 JS 语法校验。

上一轮实测：`418,158 → 407,777 字符`，排盘 / 18 卡 / 服务端请求全部正常，零 JS 报错。

> ### ⚠️ 关键前提：源仓库必须不公开
>
> 只要 `Zhan27/bazimingli` 还是 public，别人直接读 `命理排盘.html` 就看到全部 Prompt，
> **发一份精简版出去等于白做**。正确姿势：
>
> - 源仓库 → **Private**（或至少把含 Prompt 的 `命理排盘.html` 从公开仓库移出）
> - 公开仓库 / GitHub Pages → 只放 `dist/index.html`
> - Prompt 模板 → 只在本地 `worker/prompt-template.json`，随 wrangler bundle 进云端
>
> 换个说法：`worker/` 提供的是**机制**，公开仓库提供的是**暴露面**。机制再好，仓库公开也没用。

---

## 边界（说清楚没做到的）

- 目前由服务端保管的是 **`system`**（研判准则、流派人格、评分规则、命格原型、输出格式）。
- `aiBuildKnowledge()` 依赖的取象字典 / 十神心法 / 典籍匹配（约 63 KB）**仍在客户端**，因为要由盘面数据现场计算。这部分多为公开命理典籍整理，敏感度低于研判准则；若要一并搬走，需要把 `zh` 的派生逻辑也迁到服务端。
- 合婚 `hhAiDeep` 与追问 `aiFollowUp` 有各自独立的 Prompt，目前仍由客户端发送；要保护需再各配一个端点。

---

## 安全说明

- Key 与模板都不落代码、不进 git；模板通过 `wrangler deploy` 随 bundle 上传
- 服务端不缓存、不落盘对话内容，`Cache-Control: no-store`
- 路径白名单，不会被当通用代理滥用
- 限流为 isolate 内存级（重启清零、多实例不共享）；要精确额度请接 KV / D1
- 生产环境建议把 `Access-Control-Allow-Origin` 从 `*` 收窄到你的站点域名，并轮换访问码
