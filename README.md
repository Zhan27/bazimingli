# 命理排盘 · 八字合婚一体机

一个**单文件、纯前端、本地计算**的传统命理排盘应用：八字排盘 + 紫微斗数 + 合婚配对 + AI 深度解读，全部逻辑内嵌于一个 HTML 文件，无需后端、无需安装。

> 🌐 在线体验：https://d59403144e4747e6b7bd9898c99cdee7.sh5.agentos-app.net

## ✨ 功能特性

### 排盘体系
- **P1 命格总断**：四柱八字、身强弱判定、用神取用、格局定名、过三关断语（可勾选留存）
- **P2 命盘细论**：宫位、大运流年、神煞、纳音等分模块细论
- **P3 多维分析**：18 个维度卡片（性格、事业、财运、婚姻感情、健康等），每维独立成卡
- 出生地进行**复合五行与气候调候修正**，支持农历/公历双历、真太阳时

### AI 深度解读
- **18 维 AI 卡片**：AI 输出按【1】~【18】解析，逐卡回填点亮（徽章 + 边框变色），支持风险提示本地兜底
- **双通道**：内置 API 一键流式生成，或提取完整 Prompt 粘贴到任意外部 AI（DeepSeek / ChatGPT / Claude 等）后回填
- **Prompt 研判导向**：喂给 AI 的是完整盘面事实与研判准则（而非硬分数），要求 AI 独立推导、推断过程可见

### 合婚配对
- 双方八字合盘：合盘指数 + 十余项确定性维度（六合/六冲/三合/六害/三刑、天干五合、配偶星、纳音、九星命卦、紫微命宫、大运同步、调候互补等）
- **深度研判**：星宫同位、缘分密码等延伸分析
- **AI 合婚五段卡片**：相处模式 / 感情浓度 / 潜在矛盾点 / 经营建议 / 综合断，逐卡回填；解析器兼容 markdown 加粗、序号、### 标题等格式变体
- **合婚结论回填命盘**：合过婚后，主盘"婚姻感情"卡片自动显示最近合婚摘要，并可一键带本命盘跳转合婚

### 其他
- 多模块解读记录留存（localStorage），换设备可导出/导入
- 纯本地计算：出生信息不上传任何服务器

## 🚀 部署 / 运行

### 本地运行
直接双击打开 `命理排盘.html` 即可（也可用任意静态服务器）。

### GitHub Pages（3 步）
1. 本仓库 Fork / Clone 后，`docs/` 目录已是同步好的可部署副本（`index.html` + `assets/`）
2. 仓库 **Settings → Pages → Source** 选择 `Deploy from a branch`，Branch 选 `main`，目录选 **`/docs`**，Save
3. 访问 `https://<你的用户名>.github.io/<仓库名>/`

> 注：GitHub Pages 分支部署模式仅支持根目录（root）或 `/docs`，故部署副本放在 `docs/`。

### 更新内容后重新同步
```bash
bash sync_deploy.sh   # 把最新的 命理排盘.html 同步到 docs/index.html
```

## 📁 目录结构

```
├── 命理排盘.html      # 主文件（全部功能，单文件自包含）
├── docs/              # 部署副本（GitHub Pages 入口，/docs 模式）
├── sync_deploy.sh     # 源文件 → docs 同步脚本
├── launcher.py        # 桌面版启动器（pywebview）
└── .gitignore
```

## 🖥️ Windows 桌面版（exe）

`Release` 页提供打包好的单文件 exe（基于 pywebview + PyInstaller，双击即用，无需安装浏览器之外任何依赖；Win10/11 自带 WebView2 运行时）。自行打包：

```bash
python -m venv venv && venv\Scripts\pip install pywebview pyinstaller
venv\Scripts\pyinstaller --onefile --noconsole --name 命理排盘 --add-data "命理排盘.html;." launcher.py
```

## ⚠️ 免责声明

本应用基于传统子平八字、紫微斗数等命理文化的确定性规则推演，AI 解读为概率性倾向参考。**仅供传统文化学习与娱乐，不构成任何医疗、投资、婚姻决策依据**。请理性看待，切勿迷信。

## 📄 许可

仅供学习交流使用。
