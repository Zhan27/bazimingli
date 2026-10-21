/**
 * Prompt 迁移一致性校验
 * ------------------------------------------------------------------
 * 校验目标：worker 侧 buildDivine() 用抽取出的模板拼出来的 system / user，
 *          必须与浏览器里 aiBuildSchoolPrompt() 的原始输出**逐字节相同**。
 *
 * 关键点：ground truth 用的是**另一张命盘**（1976-02-29 酉时），
 *        因此能证明模板与具体盘面无关，不是硬编码抄了一份输出。
 *
 * 用法： node worker/verify-prompt.mjs <_gt.json>
 */
import fs from 'node:fs';

const gtPath = process.argv[2] || '_gt.json';
const workerSrc = fs.readFileSync('worker/worker.js', 'utf8');
const tpl = JSON.parse(fs.readFileSync('worker/prompt-template.json', 'utf8'));
const gt = JSON.parse(fs.readFileSync(gtPath, 'utf8'));

if (!gt.ok) {
  console.error('✗ ground truth 无效:', gt.err);
  process.exit(2);
}

// 从真实 worker 源码里取出 buildDivine，避免测试里复制一份实现造成漂移
const m = workerSrc.match(/function buildDivine\(body\) \{[\s\S]*?\n\}/);
if (!m) {
  console.error('✗ 未能从 worker.js 提取 buildDivine()');
  process.exit(2);
}
const buildDivine = new Function('PROMPT_TEMPLATE', m[0] + '\nreturn buildDivine;')(tpl);

let pass = 0, fail = 0;
const diff = (label, a, b) => {
  if (a === b) { pass++; return; }
  fail++;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.log(`  ✗ ${label}`);
  console.log(`      期望 ${b.length} 字符 / 实得 ${a.length} 字符，首个差异在 #${i}`);
  console.log(`      期望: …${JSON.stringify(b.slice(Math.max(0, i - 40), i + 40))}`);
  console.log(`      实得: …${JSON.stringify(a.slice(Math.max(0, i - 40), i + 40))}`);
};

console.log('· 模板来源 : worker/prompt-template.json');
console.log('· 校验盘面 : 1976-02-29 酉时（与抽取模板时用的盘不同）');
console.log('');

for (const s of ['0', '1', '2', '3', '4']) {
  const g = gt.schools[s];
  for (const withZiwei of [true, false]) {
    const body = {
      school: Number(s),
      withZiwei,
      knowledge: gt.knowledge,
      basic: gt.basic,
      chart: gt.chart,
      zwRef: withZiwei ? g.zwRef : '',
      zwGuide: withZiwei ? g.zwGuide : ''
    };
    const out = buildDivine(body);
    const sys = out.messages[0].content;
    const usr = out.messages[1].content;
    const tag = `流派${s}${withZiwei ? '·开紫微' : '·关紫微'}`;
    diff(`${tag} system`, sys, withZiwei ? g.withZw : g.noZw);
    diff(`${tag} user`, usr, withZiwei ? g.userWith : g.userNo);
    // 额外：确保模板占位符已被替换干净
    if (sys.includes('{{KNOWLEDGE}}') || sys.includes('{{ZW_BLOCK}}')) {
      fail++;
      console.log(`  ✗ ${tag} 占位符残留`);
    }
  }
}

console.log('');
if (fail === 0) {
  console.log(`✓ 全部通过：${pass} 项逐字节一致（5 流派 × 开关紫微 × system/user）`);
  process.exit(0);
} else {
  console.log(`✗ ${fail} 项不一致 / ${pass} 项通过`);
  process.exit(1);
}
