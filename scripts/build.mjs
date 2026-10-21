import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import sourceList from './source-list.cjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const sources=sourceList.sources;
export function render(){
  const read=path=>readFileSync(resolve(root,path),'utf8').replace(/\r\n?/g,'\n');
  const license=read('vendor/lunar-LICENSE.txt');
  const scripts='/* lunar-javascript 1.7.7 — third-party license\n'+license+'\n*/\n'+sources.map(path=>'/* Source: '+path+' */\n'+sourceList.sourceText(root,path).trim()).join('\n\n');
  new vm.Script(scripts,{filename:'release-inline.js'});
  const patterns=[/sk-[A-Za-z0-9_-]{16,}/,/AIza[0-9A-Za-z_-]{20,}/,/gh[pousr]_[A-Za-z0-9]{20,}/,/xox[baprs]-[A-Za-z0-9-]{10,}/,/\bkey\s*:\s*['"][^'"\s]{16,}['"]/];
  const template=read('src/template.html').replace('</style>',read('src/ui/workbench.css')+'\n</style>');
  if(patterns.some(re=>re.test(template+'\n'+scripts))) throw new Error('疑似硬编码密钥：发布已中止（不输出匹配内容）');
  if(template.split('<!-- APP_SCRIPTS -->').length!==2) throw new Error('模板必须含一个 APP_SCRIPTS 标记');
  return template.replace('<!-- APP_SCRIPTS -->','<script>\n'+scripts.replace(/<\/script/gi,'<\\/script')+'\n</script>');
}
export function build(check=false){
  const html=render();
  for(const path of ['命理排盘.html','docs/index.html']){
    const absolute=resolve(root,path);
    if(check){ if(readFileSync(absolute,'utf8')!==html) throw new Error(path+' 未同步，请执行 npm run build'); }
    else {mkdirSync(dirname(absolute),{recursive:true});writeFileSync(absolute,html);}
  }
  console.log((check?'已校验':'已生成')+'单文件与 docs/index.html，SHA256 '+createHash('sha256').update(html).digest('hex'));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) build(process.argv.includes('--check'));
