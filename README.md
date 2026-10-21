# 命理排盘 · 八字合婚一体机

本项目面向世界各地对中国传统文化、八字及相关术数感兴趣的学习者与爱好者，提供排盘参考、规则查阅和学习交流工具。项目主要借助 **OpenAI Codex** 辅助完成代码编写与修改、数据整理与统计、测试验证及文档维护，持续提升计算过程的透明度与可复现性。项目内容用于传统文化学习与参考，不代表经过科学验证的预测结论。

一个**单文件、纯前端、本地计算**的传统命理排盘应用：八字排盘 + 紫微斗数 + 奇门遁甲 + 六爻 + 合婚配对 + AI 深度解读，发布文件包含全部逻辑，无需后端、无需安装。开发源码已拆分到 `src/`，经构建生成两个完全一致的单 HTML 文件。

> 🌐 在线体验：[玄机命理工作台](https://zhan27.github.io/bazimingli/docs/)
> 🖥️ Windows 桌面版：见 [Release](https://github.com/Zhan27/bazimingli/releases)（`mingli-paipan.exe`）

## ✨ 功能特性

### 5.19：传统文化学习工作台

黛青导航与暖白内容区；桌面并排填写资料与核对命盘，手机按阅读顺序排列。学习/专业视图可以切换，复杂时区、流派和换日设置保留在展开区域。新增合成示例、入门指引、可检索的术语与出处状态、本地记录搜索和键盘导航。原有计算、六个模块、记录与备份继续保留。

![工作台实际截图](verification/screenshots/workbench-desktop.png)

设计参考与许可证核对见 [前端参考说明](docs/UI-REFERENCES.md)。当前版本下载见 [Releases](https://github.com/Zhan27/bazimingli/releases/latest)。本轮已完成的开发与暂停范围见 [进度说明](PROGRESS-21-96.md)。

### 5.17：计算规则与可追溯结果
- 明确选择子初23:00或子正00:00换日；原钟表时刻、UTC偏移、手动夏令时修正、东八区时刻和真太阳时分项显示。默认仍为东八区，不自动查询历史时区。
- 内置2,704个 GeoNames 城市点位（WGS84、稳定ID、来源版本），使用精确别名或地点选择器；同名点位要求选择，不猜测匹配。数据按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用，来源为 [GeoNames](https://www.geonames.org/)。
- 未知时辰显示按时辰、换日、交节等边界划分的候选区间和稳定/变化四柱，不生成确定时柱、大运或默认评分。
- 五行支持天干、天干加本气、天干加全部藏干三种不加权统计；页面列出得令、通根、得势评分。显示口径不改变原有评分模型。
- 五套流派配置统一驱动显示、取用策略及Prompt。象法、格局派保留其解释重点，量化扶抑仅供参考；未声称实现完整古典流派算法。
- 每次CI运行全部历史基准，生成输入、来源、预期、实际和差异报告。新增逐项说明见 [11—20验收报告](ACCEPTANCE-11-20.md)。

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
- 排盘计算在本地；主动使用 AI 时，命盘与输入信息会发送到你配置的服务地址

## 🚀 部署 / 运行

### 本地运行
直接双击打开 `命理排盘.html` 即可（也可用任意静态服务器）。

### GitHub Pages（3 步）
1. 本仓库 Fork / Clone 后，`docs/` 目录已是同步好的可部署副本（`index.html`）
2. 仓库 **Settings → Pages → Source** 选择 `Deploy from a branch`，Branch 选 `main`，目录选 **`/docs`**，Save
3. 访问 `https://<你的用户名>.github.io/<仓库名>/`

> 注：GitHub Pages 分支部署模式仅支持根目录（root）或 `/docs`，故部署副本放在 `docs/`。

### 开发与更新发布文件

需要 Node.js 22+；修改 `src/` 或 `data/` 后执行：

```bash
npm ci
npm run build
npm run check
npm test
npm run regression
npx playwright install chromium
npm run test:e2e
```

也可运行兼容入口：

```bash
pwsh -File sync_deploy.ps1   # Windows
bash sync_deploy.sh          # macOS / Linux / WSL
```

两个入口均调用 `scripts/build.mjs`：按 `scripts/source-list.cjs` 清单嵌入源码、数据和固定版本历法库，检查 JS 语法及疑似密钥，再生成相同的 `命理排盘.html` 与 `docs/index.html`。`npm run check` 只比对、不写文件；GitHub Actions 自动检查、运行测试并保存计算回归报告。

## 🖥️ Windows 桌面版（exe）

`Release` 页提供打包好的单文件 exe（基于 pywebview + PyInstaller，双击即用；Win10/11 自带 WebView2 运行时）。自行打包：

```bash
python -m venv venv
venv\Scripts\pip install pywebview pyinstaller
venv\Scripts\pyinstaller --onefile --noconsole --name 命理排盘 --add-data "命理排盘.html;." launcher.py
```

`launcher.py` 用固定端口 `127.0.0.1:8765` 起本地回环服务再套原生窗口 —— 这样 origin 稳定，localStorage 里的记录和 AI 配置不会每次启动就丢（`file://` 直接加载在不透明源下写入不稳定）。

## 📁 目录结构

开发源码与规则说明见 [CONTRIBUTING.md](CONTRIBUTING.md)；测试资料和精度边界见 [SOURCES.md](tests/fixtures/SOURCES.md)；长期任务见 [ROADMAP.md](ROADMAP.md)。

- `src/calendar/`、`src/bazi/`：无 DOM 的历法与四柱基础计算。综合引擎仍逐步拆分。
- `src/storage/`、`src/ai/`：版本化备份与纯文本分段。
- `src/ui/`、`src/template.html`：现有交互、术数与页面模板。
- `vendor/`：内嵌历法库与原始 MIT 许可证。
- `tests/`、`scripts/`、`.github/workflows/`：基准、构建、浏览器验证与 CI。

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

### v5.16
- 统一 `ml_records`，兼容旧 `mingli_records` 和 v4 备份；v5 备份逐字段验证，排除 API 设置，导入失败回滚。
- 从弱、身弱、中和、身强、身极强完整传递至命盘、摘要、Prompt 和 PNG；中和不再按身弱显示。
- 节气使用 lunar-javascript 1.7.7 的交节时刻；支持具体出生时分和子初/子正换日。真太阳时实际参与日/时柱计算，保留跨日信息。
- 日期范围明确为公历 **1900-01-31 至 2099-12-31**，非法农历/闰月/经度明确报错。
- 年/月柱按出生瞬间的东八区标准时交节；日/时柱按所选太阳时与换日规则。历史夏令时不自动还原；仅知时辰、城市中心经度和近似均时差的精度限制在页面标示。
- 增加历法来源与回归测试、18维异常解析测试、真实浏览器备份/恶意输入/离线/PNG检查，以及自动构建同步校验。
- 修复姓名、地点、合婚详情和历史记录的动态 HTML 边界；新增 MIT、贡献指南和 Roadmap。


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

本项目采用 [MIT License](LICENSE)，允许复制、修改和分发（包括商业使用），须保留版权和许可声明；第三方依赖见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。命理文化用途的免责声明与软件许可分别适用。
