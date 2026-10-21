const fs=require('node:fs'),path=require('node:path'),acorn=require('acorn'),{Linter}=require('eslint');
const {sources,sourceText}=require('./source-list.cjs'),root=path.resolve(__dirname,'..');
const files=sources.filter(f=>f.endsWith('.js')&&!f.startsWith('vendor/'));
const text=files.map(f=>sourceText(root,f)).join('\n');
const ast=acorn.parse(text,{ecmaVersion:'latest'}),top=ast.body.flatMap(n=>n.type==='FunctionDeclaration'?[n.id.name]:n.type==='VariableDeclaration'?n.declarations.filter(d=>d.id.type==='Identifier').map(d=>d.id.name):[]);
const globals=Object.fromEntries(['Solar','Lunar','LunarYear','LunarMonth','CITY_DATA','SCHOOL_PROMPTS','KB_TERMS','document','window','navigator','localStorage','sessionStorage','alert','confirm','prompt','fetch','AbortController','TextDecoder','TextEncoder','URL','Blob','FileReader','Image','XMLSerializer','performance','setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame','console','crypto','getComputedStyle','Event','MutationObserver','Node','HTMLElement','btoa','atob'].map(k=>[k,'readonly']));
const messages=new Linter().verify(text+'\nvoid ['+top.join(',')+'];',{languageOptions:{ecmaVersion:'latest',sourceType:'script',globals},rules:{'no-undef':'error','no-unreachable':'error','no-dupe-args':'error','no-unused-vars':['warn',{args:'none',caughtErrors:'none',vars:'all',ignoreRestSiblings:true}]}});
const counts={};for(const m of messages){const k=m.ruleId+':'+m.message;counts[k]=(counts[k]||0)+1;}
const baselinePath=path.join(root,'tests/fixtures/lint-baseline.json');
if(process.argv.includes('--record-baseline'))fs.writeFileSync(baselinePath,JSON.stringify(counts,null,2)+'\n');
const baseline=fs.existsSync(baselinePath)?JSON.parse(fs.readFileSync(baselinePath)):{};
const errors=messages.filter(m=>m.severity===2),newWarnings=Object.keys(counts).filter(k=>k.startsWith('no-unused-vars:')&&counts[k]>(baseline[k]||0));
fs.mkdirSync(path.join(root,'verification'),{recursive:true});fs.writeFileSync(path.join(root,'verification/lint.json'),JSON.stringify({errors,warnings:messages.filter(m=>m.severity===1),baselinePolicy:'Existing unused local variables are recorded; new unused warnings or any undefined name are rejected.'},null,2)+'\n');
console.log(`Static check: ${errors.length} errors, ${messages.length-errors.length} recorded warnings, ${newWarnings.length} new warnings`);
if(errors.length||newWarnings.length){for(const m of errors.slice(0,10))console.error(m.line,m.message);for(const w of newWarnings.slice(0,10))console.error(w);process.exitCode=1;}
