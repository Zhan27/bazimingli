// One-time source-preserving extraction; retained to document the migration.
const fs=require('node:fs'),path=require('node:path'),acorn=require('acorn');
const root=path.resolve(__dirname,'..'),file=path.join(root,'src/ui/app.js');
let source=fs.readFileSync(file,'utf8').replace(/\r\n?/g,'\n');
if(source.includes('/* Modules extracted in 5.18 */'))throw new Error('Migration already applied');
const ast=acorn.parse(source,{ecmaVersion:'latest',ranges:true});
const nodes=ast.body,byName=new Map();
for(const n of nodes){const names=n.type==='FunctionDeclaration'?[n.id.name]:n.type==='VariableDeclaration'?n.declarations.map(d=>d.id.name):[];for(const name of names)byName.set(name,n);}
const groups=new Map(),selected=new Set();
function add(group,n){if(!n||selected.has(n))return;selected.add(n);if(!groups.has(group))groups.set(group,[]);groups.get(group).push(n);}
function range(group,start,end,except=[]){const a=source.indexOf(start),b=source.indexOf(end);if(a<0||b<0)throw new Error(start);for(const n of nodes)if(n.start>=a&&n.start<b&&!except.some(name=>byName.get(name)===n))add(group,n);}
range('ziwei/engine','const ZW_STARS=','function renderZW(',['zwNow','zwCast']);
range('qimen/engine','const QM_GONG=','function renderQM(',['qmNow','qmCast']);
range('liuyao/engine','const BAGUA=','function lyModeChange(',['lyYaoSeq']);
range('liuyao/engine','const GUA_NAMES=','function lyCast(');
range('liuyao/engine','function lyDerived(','/* ======================== 综合排盘');
range('hehun/engine','const HH_LIUHE=','function hhReadSide(');
for(const name of ['zhPlaceMatch','zhPlaceWx','zhPlaceFull','zhPlaceFullName','CITY_WX','CITY_WX_DIR','CITY_WX_SUB'])add('bazi/geography',byName.get(name));
for(const name of ['getChangSheng','getMingGua','CHANGSHENG','CS_START','lunarMonthName','lunarDayName','fmtLocalDate'])add('bazi/auxiliary',byName.get(name));
for(const name of ['aiFetch','aiErrMsg','aiStreamChat','aiEndpoint','aiHeaders','aiDivineEndpoint'])add('ai/transport',byName.get(name));
const kb=byName.get('KB_TERMS');
const terms=Function('return ('+source.slice(kb.declarations[0].init.start,kb.declarations[0].init.end)+')')();
fs.mkdirSync(path.join(root,'src/knowledge'),{recursive:true});
fs.writeFileSync(path.join(root,'data/terms.json'),JSON.stringify(terms,null,2)+'\n');selected.add(kb);
for(const [group,items] of groups){const dest=path.join(root,'src',group+'.js');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,'/* Extracted without calculation changes. See docs/ARCHITECTURE.md. */\n'+items.sort((a,b)=>a.start-b.start).map(n=>source.slice(n.start,n.end)).join('\n\n')+'\n');}
for(const n of [...selected].sort((a,b)=>b.start-a.start))source=source.slice(0,n.start)+source.slice(n.end);
fs.writeFileSync(file,'/* Modules extracted in 5.18 */\n'+source);
console.log('Extracted',selected.size,'declarations into',groups.size,'modules and terms data');
