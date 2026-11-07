# GitHub 参考筛选与吸收

2026-11-07 查询 GitHub，按八字、紫微和历法相关性筛选。星数为当日快照，完整元数据见 [查询收据](../verification/github-reference-survey.json)。

| 项目 | Stars | 本轮实际检查 | 采用方式 |
|---|---:|---|---|
| [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu/tree/a600484a49255039d0725f1ba9e11ca81a948f97) | 16546 | README、`lib/ziwei/clock-adjust.ts` | 借鉴明确呈现钟表口径、由用户确认校正的交互思路。本项目已有固定UTC偏移和手动DST，后续审查历史时间提示。本轮未移植其校正函数或断语数据。 |
| [SylarLong/iztro](https://github.com/SylarLong/iztro/tree/d7df0a54c9f98f916a33ad4b025001a6b0235275) | 4354 | README、`src/astro/FunctionalAstrolabe.ts` 第23—56行 | 运限查询接收独立目标日期，与本命数据分层。本轮使用已有紫微引擎，自行增加网页流年参考年、记录区分和备份回放。 |
| [jinchenma94/bazi-skill](https://github.com/jinchenma94/bazi-skill/tree/112a5d84cd1a001a0038cafca3be68d93e4c0cc9) | 3827 | README、`scripts/test_pai_pan.py` 第1—150行 | 借鉴正常时辰、早晚子时与立春前成组核对的方式，补充5个已公开测试输入的同口径检查。没有安装其Skill或移植算法、命理摘要。 |
| [DestinyLinker/MingLi-Bench](https://github.com/DestinyLinker/MingLi-Bench/tree/b7433280fd86d7a7c27debbc47d0303c218f0bfd) | 2565 | README、目录结构 | 参考其预计算排盘与模型答题分开评测、保留逐例结果的组织方式。后续模型评测须分开记录历法正确性、协议和回答质量。本轮没有导入命例数据或执行收费评测。 |
| [6tail/lunar-javascript](https://github.com/6tail/lunar-javascript) | 1739 | 实时仓库元数据、本仓库现有固定依赖1.7.7 | 继续使用已锁定的历法依赖。更新依赖前需比较历法边界和版本差异。 |
| [china-testing/bazi](https://github.com/china-testing/bazi/tree/33b18354d5407727640e545c3aaec0efb4bf5282) | 1558 | README与示例 | 藏干十神、冲合刑关系在柱位上展示，作为已有关系工作台的交互参考。元数据未声明许可证，本轮不移植其代码或评判文字。 |
| [OPN48/cnlunar](https://github.com/OPN48/cnlunar) | 863 | 实时元数据，既有5.26研究记录 | 继续采用正例、错误反例成对核对的方式。已有研究见 [5.26吸收记录](REFERENCE-ADOPTION.md)。 |
| [6tail/tyme4ts](https://github.com/6tail/tyme4ts/tree/cee2493970d5571f96e272527a1a899d4dac1b9e) | 521 | README | 日历类型与转换边界作为后续对照入口，保留既有换日分歧收据。同作者算法的一致性不能充当独立天文验证。 |

## 本轮实现

紫微网页新增流年参考年，范围1900—2099。该年份直接指定目标太岁年，留空沿用网页原有的当前公历年份默认值。`calculateModule('ziwei', ...)` 的默认值仍为出生公历年，需可重复比较时请明确传入 `referenceYear`，或以 `referenceDate` 按农历正月初一确定年份。

参考年参与紫微记录身份，同一出生输入的不同流年可以分别保存。重排、统一记录管理和备份保留实际采用的参考年，记录列表显示年份。旧记录缺少年份时，显示“参考年未保存”，重排沿用当年默认并保存本次实际年份，无法还原未曾记录的旧年份。跨版本保留这个新增字段需要5.43及以上版本。

本命星位、命身宫与生年四化不因参考年改变。沿用本项目现有安星和四化规则，本轮没有新增大限/流月计算或引入iztro运行依赖。

同时修复六爻记录回放后的模式控件，时间、三数、铜钱三种方式分别恢复数字输入、摇卦面板和六爻序列，恢复后的卦盘文字与原记录核对。

代码与数据许可分开核对。Renhuai项目代码MIT、解读数据和讲义另有条款。本轮独立实现交互，没有导入这些资料库。高星数只用于筛选参考，采用规则仍需明确口径和验证。

## 5.43本地验证

160项Node、7项Python、97项Chrome回归通过，共264项。构建产物一致，静态检查0错误、32项既有警告、0新增警告。两个新增Node用例先复现年份被丢弃及不同年份覆盖的问题，再通过修复验证。浏览器检查1440px和320px下的年份选择、不同年份保存、相同输入回放、真实备份下载及恢复、旧记录和无效年份。

320px表单截图另外人工复核，标签、年份输入、按钮及说明完整可见。这里记录本地验证，云端CI与Release附件需要按 [发布流程](RELEASING.md) 分别读回。

## 5.44补充对照

扩大中文关键词检索后补充 `jinchenma94/bazi-skill`（MIT，3827 stars）。正常午时、立春前、晚子时、早子时及阴年5个输入，在固定UTC+8、无DST、子初换日口径下，所检查的10个公开期望字段与本仓库一致。逐字段收据见 [小样本对照](../verification/bazi-skill-spot-check.json)。这只覆盖来源测试中列出的字段，没有运行对方软件或证明完整算法一致。
