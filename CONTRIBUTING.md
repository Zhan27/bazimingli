# 贡献指南

开发完整验证需要 Node.js 22+ 和 Python3.12+，执行 `npm run verify` 包含计算、浏览器与桌面回环服务测试。用户直接打开发布 HTML，无需 Node、npm 或网络；可选AI需要网络。

```sh
npm ci
npm run build
npx playwright install chromium
npm run verify
```

Windows 如果已安装标准路径的 Chrome，浏览器测试自动使用该 Chrome。

请修改 `src/` 源码，然后执行 `npm run build`。提交源码和两个生成文件 `命理排盘.html`、`docs/index.html`，不要只手改生成文件。`npm run check` 会重新生成内存中的预期内容并比对两个文件，同时检查 JS 语法和疑似密钥。PowerShell 和 Bash 同步脚本均调用相同构建器。

计算问题请提供最小输入（用合成样本代替个人资料）、实际与预期四柱、采用的时区、历法、时分、经度、太阳时和换日规则，以及参考来源。先增加失败案例，再修复计算。注明测试属于独立资料比对、版本回归，还是内部一致性检查。算法自洽不等于命理预测有效。

目录职责：

- `src/calendar/calendar.js`：历法适配、节气、钟表时间到东八区的转换及近似真太阳时；无 DOM。
- `src/calendar/locations.js`、`candidates.js`：标准化地点查找和未知时辰候选分段；无 DOM。
- `data/cities.json`：带来源与下载哈希的GeoNames数据。使用 `python scripts/import-geonames.py --help` 查看重建参数；不要提交原始压缩包。
- `src/bazi/profiles.js`、`scoring.js`：版本化流派配置、五行统计与得令/通根/得势分项；历史流派文字在 `data/school-prompts.json`。
- `src/bazi/data.js`：干支、五行、十神基础表。
- `src/bazi/engine.js`：四柱、运序、旺衰状态和综合计算函数；`calculateBirth` 可独立于 UI 调用。综合 `zhCompute` 仍依赖紫微/奇门等旧模块，继续按 Roadmap 拆分。
- `src/storage/records.js`：版本化备份、字段校验和迁移。
- `src/ai/dimensions.js`：纯文本的 18 维切段。
- `src/ui/app.js`：交互、渲染、其他术数及现有 AI 逻辑。
- `src/template.html`：页面模板；`scripts/build.mjs` 将所有 JS 内嵌成单文件。
- `scripts/source-list.cjs`：发布构建和测试共用的加载清单，新增模块时同步维护。
- `tests/`：Node 计算/安全测试和 Playwright 浏览器用例；资料说明见 `tests/fixtures/SOURCES.md`。

不要提交 API Key、个人出生信息、浏览器存储备份、`node_modules` 和测试缓存。新增依赖应锁定版本、核验许可证，并保留原始版权声明。`vendor/lunar.js` 为未修改的 lunar-javascript 1.7.7 源码，更新需同步 npm 锁文件、vendor 文件、第三方声明并重跑基准。

提交 PR 时说明问题触发条件、修复后的行为、验证命令和规则/数据范围限制。CI 必须通过；不为通过测试而删除来源有据的失败案例。

`npm test` 同时生成 `verification/regression.json` 和 `verification/solar-reference.json`。前者逐条保存冻结完整命盘的输入、规则版本、来源、预期、实际及差异；后者保存独立均时差参考的全部450个样本。CI始终上传报告，失败时另存浏览器证据。`npm run regression` 可单独重跑命盘基准。基准预期不得在CI自动更新；若有意改变算法，提交新的版本化预期及来源、差异说明，保留旧版以便审查。
