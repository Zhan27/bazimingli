# 中转服务（Cloudflare Worker）

**解决什么**：让 API Key 只存在服务端，浏览器里永远没有 Key。
前端「BaseURL」填本 Worker 的 `/v1`，「API Key」栏填**访问码**，就这样 —— 前端代码零改动，因为中转服务对前端来说就是一个普通的 OpenAI 兼容接口。

---

## 为什么需要它

| 场景 | 直连（现状默认） | 中转（本 Worker） |
|---|---|---|
| 每个使用者填自己的 Key | 适合 | 不必要 |
| **你自己想内置 Key 给别人用** | **Key 会出现在浏览器 → 必被抄** | **Key 只在服务端，前端拿不到** |
| 想限额度 / 限模型 / 防刷 | 做不到 | 支持 |
| 想进一步藏 Prompt | 做不到（前端明文） | 支持（`/v1/divine` 由服务端注入） |

一句话：**你上轮担心的"内置 Key 会不会被逆出来"，用这个就彻底不存在了。** 别人抽干前端，只能看到"向你的 Worker 发一个聊天请求"。

---

## 部署（5 分钟）

```bash
npm i -g wrangler
wrangler login
cd worker
wrangler deploy
```

然后配密钥（**不要写进代码，不要提交**）：

```bash
wrangler secret put API_KEY        # 真实上游 Key，例：sk-xxxx
wrangler secret put ACCESS_CODES   # 你自定的访问码，逗号分隔可多个：code-a,code-b
wrangler secret put SYSTEM_PROMPT  # 可选，仅 /v1/divine 需要
```

非机密配置在 `wrangler.toml` 的 `[vars]` 里改：

| 变量 | 说明 | 默认 |
|---|---|---|
| `UPSTREAM_BASE` | 上游地址，不带 `/chat/completions` | `https://api.deepseek.com/v1` |
| `DAILY_LIMIT` | 每 IP 每日请求上限，`0`=不限 | `80` |
| `ALLOWED_MODELS` | 模型白名单，逗号分隔，空=不限 | `deepseek-chat` |
| `MAX_TOKENS_CAP` | 单次 max_tokens 硬上限 | `8192` |

---

## 前端怎么填

在页面右上角「🤖 AI 深度解读设置」：

```
BaseURL  = https://xuanji-mingli-proxy.<你的子域>.workers.dev/v1
API Key  = <你设的 ACCESS_CODES 里的任意一个>
模型名   = deepseek-chat
```

点「测试连接」→ 应返回 ✅。此时打开浏览器开发者工具的 Network，**看不到任何真实 Key**，只有一个访问码。

---

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 健康检查，不需要鉴权 |
| POST | `/v1/chat/completions` | 主入口，OpenAI 兼容，支持 `stream:true` 透传 |
| GET | `/v1/models` | 转发上游模型列表 |
| POST | `/v1/divine` | **服务端注入 Prompt**：请求体只发 `{chart:{...}}`，system prompt 由 `SYSTEM_PROMPT` 提供 |

鉴权：`Authorization: Bearer <访问码>` 或 `X-Access-Code: <访问码>`，二选一。

---

## 想连 Prompt 一起藏起来（进阶）

现在前端会把完整的 18 维 system prompt 发出去 —— 中转只保护了 Key。要进一步保护 Prompt：

1. `wrangler secret put SYSTEM_PROMPT`，把 `命理排盘.html` 里 `aiBuildSchoolPrompt()` 产出的 system 全文贴进去
2. 前端把请求改到 `/v1/divine`，body 只发 `{chart: JSON.parse(aiBuildChart(lastZh))}`
3. Worker 端负责拼 system + user，前端再也拿不到研判准则

做到这一步，前端就只剩"算盘面"和"画界面"，知识库与 Prompt 全部搬进服务端 —— 这才是真正意义上的防逆向。

> 注：`/v1/divine` 目前只注入了 `SYSTEM_PROMPT` 这一段；若要多流派/多模式切换，把 `school` 字段一起发上来，在 Worker 里按流派选 Prompt 即可。

---

## 安全说明

- Key 通过 Cloudflare secret 注入，不落代码、不进 git
- 服务端不缓存、不落盘对话内容，`Cache-Control: no-store`
- 路径白名单，不会被当成通用代理滥用
- 限流为 isolate 内存级（重启清零、多实例不共享）。要精确额度请接 KV / D1
- 生产环境建议把 `Access-Control-Allow-Origin` 从 `*` 改成你的站点域名，并在访问码里加上轮换
