# 命理排盘 · 八字合婚一体机

[在线体验](https://zhan27.github.io/bazimingli/docs/) · [下载 EXE / HTML](https://github.com/Zhan27/bazimingli/releases/latest) · [English guide](README.en.md) · [完整更新日志](CHANGELOG.md)

面向世界各地对中国传统文化、八字及相关术数感兴趣的学习者与爱好者，提供排盘参考、规则查阅和学习工具。项目主要借助 **OpenAI Codex** 完成代码编写与修改、数据整理与统计、测试验证及文档维护。

应用采用**单文件网页、本地计算**，也提供 Windows 桌面版。内容用于传统文化学习与参考；软件测试不代表预测结论经过科学验证，不构成医疗、投资或婚姻决策依据。

## 功能与更新概览

- **多术数排盘**：综合排盘、八字、紫微斗数、奇门遁甲、六爻与合婚配对，支持公历和农历输入。
- **历法与时间设置**：具体出生时分、UTC偏移、手动夏令时、真太阳时、子初/子正换日、城市点位选择和未知时辰候选。支持公历1900-01-31至2099-12-31，历史时区需自行核对。
- **传统文化学习**：紧凑综合盘、学习/专业视图、[可展开条件与缺项的命格总断](docs/SYNTHESIS.md)、柱位定位和[有典籍释义的八字关系图](docs/GAN-ZHI-READING.md)；“细读与核验”展示四柱细项、本命—大运—流年分层看点及节气流月。
- **AI辅助解读**：五套流派配置、18维卡片、按命盘与主题选取知识、事实与规则引用；支持取消、会话草稿恢复、逐卡操作和主动重试。AI回复不替换本地计算结果。
- **记录与核验**：五类本地记录统一搜索、排序、备注、备份与批量管理；支持学习快照、离线JSON对照、报告导出、摘要复制、PNG导出及无DOM的JSON计算API。
- **多端阅读**：桌面与手机布局、三套主题、键盘操作、打印、独立HTML和Windows EXE。

以上汇总历次迭代形成的主要能力。各版本变更统一收录于 [CHANGELOG.md](CHANGELOG.md)，完成与待做范围见 [进度说明](PROGRESS-21-96.md) 和 [路线图](ROADMAP.md)。

![工作台实际截图](verification/screenshots/workbench-desktop.png)

## 快速使用

1. **在线**：打开[工作台](https://zhan27.github.io/bazimingli/docs/)，可先点击“试用示例”。
2. **离线网页**：下载Release中的`mingli-paipan.html`，或直接打开源码仓库中的`命理排盘.html`。
3. **Windows**：下载`mingli-paipan.exe`运行，原生窗口需要可用的WebView2运行时。

填写出生信息，核对时间、地点与换日设置后排盘。结果工具栏的“细读与核验”可查看盘面字段、按运年查看流月，或导入已有JSON进行本地对照。

不同浏览器、在线站点、本地文件和桌面服务端口使用不同的存储空间；切换使用方式前请先导出需要保留的记录。国际出生信息与时间设置见 [English guide](README.en.md)。

## 数据与AI

排盘计算在当前设备完成；本地JSON对照不上传文件、不写入记录。记录、备份、图片、学习快照和复制的内容可能包含出生信息，请妥善保管。

AI为可选功能。主动请求解读或测试连接时，数据会发送至配置的服务地址，中转运营者及上游模型服务商可能接触请求，并可能产生费用。API Key默认保存于标签页会话，浏览器恢复会话可能保留；长期保存需主动选择。浏览器存储未经加密，可在AI设置中清除Key。备份及学习快照不包含API设置。

操作与边界见 [AI工作流](docs/AI-CONTRACT.md)、[记录与备份](docs/RECORDS.md)；可选服务端中转及Prompt模式见 [Worker说明](worker/README.md)。

## 开发与构建

需要Node.js 22+和Python 3.12+：

```bash
npm ci
npx playwright install chromium
npm run build
npm run verify
```

修改`src/`或`data/`后重新构建。构建生成内容相同的`命理排盘.html`与`docs/index.html`；`npm run check`只校验同步状态。GitHub Actions执行构建检查、Node/Python/浏览器测试；版本发布流程另含Windows打包与自检。

| 文档 | 内容 |
|---|---|
| [贡献指南](CONTRIBUTING.md) · [架构说明](docs/ARCHITECTURE.md) | 源码结构与开发约定 |
| [JSON API](docs/API.md) | 计算、比较、批处理与学习视图 |
| [资料吸收与离线对照](docs/REFERENCE-MATERIALS.md) | 支持格式、来源与对照边界 |
| [测试资料来源](tests/fixtures/SOURCES.md) | 回归基准、参考数据与精度限制 |
| [前端参考](docs/UI-REFERENCES.md) | 界面参考与许可证核对 |
| [发布流程](docs/RELEASING.md) | 版本、构建与附件验证 |

## 许可

代码采用 [MIT License](LICENSE)。第三方依赖及数据见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)；城市数据来源于 [GeoNames](https://www.geonames.org/)，按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。
