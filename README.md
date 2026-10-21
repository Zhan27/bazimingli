# 命理排盘 · 八字合婚一体机

一个**单文件、纯前端、本地计算**的传统命理排盘应用：八字排盘 + 紫微斗数 + 奇门遁甲 + 六爻 + 合婚配对 + AI 深度解读，全部逻辑内嵌于一个 HTML 文件，无需后端、无需安装。

> 🌐 在线体验：https://d59403144e4747e6b7bd9898c99cdee7.sh5.agentos-app.net
> 🖥️ Windows 桌面版：见 [Release](https://github.com/Zhan27/bazimingli/releases)（`mingli-paipan.exe`）

## ✨ 功能特性

### 排盘体系
- **P1 命格总断**：四柱八字、身强弱判定、用神取用、格局定名、过三关断语（可勾选留存）
- **P2 命盘细论**：宫位、大运流年、神煞、纳音等分模块细论
- **P3 多维分析**：18 个维度卡片（性格、事业、财运、婚姻感情、健康等），每维独立成卡
- 出生地进行**复合五行与气候调候修正**，支持农历/公历双历、真太阳时
- 紫微斗数、奇门遁甲、六爻独立模块

### AI 深度解读
- **18 维 AI 卡片**：AI 输出按【1】~【18】解析，逐卡回填点亮（徽章 + 边框变色），支持风险提示本地兜底
- **双通道**：内置 API 一键流式生成，或提取完整 Prompt 粘贴到任意外部 AI（DeepSeek / ChatGPT / Claude 等）后回填
- **Prompt 研判导向**：喂给 AI 的是完整盘面事实与研判准则（而非硬分数），要求 AI 独立推导、推断过程可见
- **5 大流派**：综合多流派 / 旺衰平衡派 / 盲派象法 / 子平格局派 / 穷通调候派，各有独立人格与研判侧重

### 合婚配对
- 双方八字合盘：合盘指数 + 十余项确定性维度（六合/六冲/三合/六害/三刑、天干五合、配偶星、纳音、九星命卦、紫微命宫、大运同步、调候互补等）
- **深度研判**：星宫同位、缘分密码等延伸分析
- **AI 合婚五段卡片**：相处模式 / 感情浓度 / 潜在矛盾点 / 经营建议 / 综合断，逐卡回填；解析器兼容 markdown 加粗、序号、### 标题等格式变体
- **合婚结论回填命盘**：合过婚后，主盘"婚姻感情"卡片自动显示最近合婚摘要，并可一键带本命盘跳转合婚

### 其他
- 多模块解读记录留存（localStorage），换设备可导出/导入
- 三套主题（米白纸韵 / 玄墨青 / 青绿山水）、打印与导出 PNG、命盘摘要一键复制
- 纯本地计算：出生信息不上传任何服务器

## 🚀 部署 / 运行

### 本地运行
直接双击打开 `命理排盘.html` 即可（也可用任意静态服务器）。

### GitHub Pages（3 步）
1. 本仓库 Fork / Clone 后，`docs/` 目录已是同步好的可部署副本（`index.html`）
2. 仓库 **Settings → Pages → Source** 选择 `Deploy from a branch`，Branch 选 `main`，目录选 **`/docs`**，Save
3. 访问 `https://<你的用户名>.github.io/<仓库名>/`

> 注：GitHub Pages 分支部署模式仅支持根目录（root）或 `/docs`，故部署副本放在 `docs/`。

### 更新内容后重新同步

```bash
pwsh -File sync_deploy.ps1   # Windows
bash sync_deploy.sh          # macOS / Linux / WSL
```

两个脚本都会：同步 `命理排盘.html → docs/index.html`、做**硬编码密钥自检**（命中即中止）、校验 SHA256 一致。

## 🖥️ Windows 桌面版（exe）

`Release` 页提供打包好的单文件 exe（基于 pywebview + PyInstaller，双击即用；Win10/11 自带 WebView2 运行时）。自行打包：

```bash
python -m venv venv
venv\Scripts\pip install pywebview pyinstaller
venv\Scripts\pyinstaller --onefile --noconsole --name 命理排盘 --add-data "命理排盘.html;." launcher.py
```

`launcher.py` 用固定端口 `127.0.0.1:8765` 起本地回环服务再套原生窗口 —— 这样 origin 稳定，localStorage 里的记录和 AI 配置不会每次启动就丢（`file://` 直接加载在不透明源下写入不稳定）。

## 📁 目录结构

```
├── 命理排盘.html      # 主文件（全部功能，单文件自包含）
├── docs/index.html    # 部署副本（GitHub Pages 入口，/docs 模式）
├── worker/            # Cloudflare Worker 中转服务（隐藏 Key 与 Prompt）
│   ├── worker.js            # 中转 + 服务端 Prompt 注入
│   ├── extract-prompt.ps1   # 从源码自动抽取 Prompt 模板（含往返校验）
│   ├── verify-prompt.mjs    # 模板一致性校验（逐字节比对）
│   ├── build-thin.ps1       # 构建剥离 Prompt 的精简发布版
│   └── README.md
├── launcher.py        # 桌面版启动器（pywebview）
├── sync_deploy.ps1    # 源文件 → docs 同步（Windows，含密钥自检）
├── sync_deploy.sh     # 源文件 → docs 同步（macOS / Linux / WSL）
└── .gitignore
```

## 🔑 AI 配置与 Key

页面右上角「🤖 AI 深度解读设置」接入任意 OpenAI 兼容接口（DeepSeek / OpenAI / 通义千问等）。

- Key **只存本机**（勾选「仅本次会话」则存 sessionStorage，关浏览器即失效），请求由浏览器直连你填的地址，不经第三方
- 填入的 Key **不回显**，只显示脱敏尾号，防截图／录屏泄漏；随时可「🗑 清除 Key」
- 仓库默认 `key:''`，**不含任何 Key**；导出备份也不包含 Key
- 想把 Key 放到服务端（例如做成"打开就能用"的版本），见 [`worker/README.md`](worker/README.md) —— 前端零改动，BaseURL 填 Worker 地址、Key 栏填访问码即可

### 🎭 服务端 Prompt 模式（防逆向）

开启设置里的「使用服务端 Prompt」后，18 维研判准则（流派人格 / 独立评分标准 / 研究纪律 / 命格原型参照 / 输出格式）由 worker 的 `/v1/divine` 注入，浏览器只发命盘事实与知识库片段。

- 配套 `worker/build-thin.ps1` 可把 Prompt **从发布版 HTML 里物理删除**，产出 `dist/index.html`
- 已有校验脚本 `worker/verify-prompt.mjs`：Worker 拼出的 prompt 与原始输出**逐字节一致**（实测 20/20）
- ⚠️ 前提：**源仓库必须不公开**。只要仓库还是 public，别人直接读源码就看到全部 Prompt，发精简版没有意义。详见 [`worker/README.md`](worker/README.md)

## 📝 更新记录

### v5.15
- **服务端 Prompt 模式**：设置里勾选「🎭 使用服务端 Prompt」后，18 维研判准则改由 worker 注入，请求走 `/v1/divine`，浏览器只上传命盘事实
- **模板自动抽取**：`worker/extract-prompt.ps1` 从源码抽出 5 流派模板（18,918 字符），代入占位符，内置往返校验 10/10
- **一致性校验**：`worker/verify-prompt.mjs` 从 worker 源码真实取出 `buildDivine()` 执行，与浏览器原始输出比对 —— **20 项逐字节一致**（含用另一张命盘交叉验证）
- **精简发布版**：`worker/build-thin.ps1` 剥离 10,381 字符的 Prompt 实体，强制服务端模式，校验 8 项敏感标记全部清除 + JS 语法通过
- **模板不入库**：`worker/prompt-template.json` 与校验样本已加入 `.gitignore`

### v5.14
- **AI 请求层重构**：四处 `fetch` 合并为统一 `aiFetch()` / `aiStreamChat()`，删掉三份重复的 SSE 解析
- **超时保护**：非流式 60s；流式支持「静默 90s」+「总时长」双重中断，弱网不再无限挂起、按钮不再永久禁用
- **错误提示可操作**：401/402/403/404/413/429/5xx 分别给出中文原因与修法，并带回上游原文摘要
- **18 维不再被截断**：新增 `max_tokens` 设置（默认 8000）。此前用服务端默认 4096，长解读会被截在半路导致【18】缺失
- **Key 安全**：不回显明文、「仅本次会话」模式、一键清除
- **阅读体验**：流式输出时仅在你已滚动到底部才自动跟随，上翻查看不再被拽回
- **BaseURL 容错**：自动补 `/chat/completions`，写完整路径或只写 `/v1` 都能用
- **SEO / 分享**：补齐 OG、Twitter Card、theme-color、keywords、apple-touch-icon
- **部署脚本**：新增 PowerShell 版；两个脚本都加了硬编码密钥自检
- **中转服务**：新增 `worker/`，可把 API Key 移到服务端
- **桌面版**：新增 `launcher.py`（此前 README 提到但仓库里缺该文件）

## ⚠️ 免责声明

本应用基于传统子平八字、紫微斗数等命理文化的确定性规则推演，AI 解读为概率性倾向参考。**仅供传统文化学习与娱乐，不构成任何医疗、投资、婚姻决策依据**。请理性看待，切勿迷信。

## 📄 许可

仅供学习交流使用。
