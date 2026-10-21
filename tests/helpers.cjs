const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function memoryStorage(initial={}){
  const map=new Map(Object.entries(initial));
  return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),clear:()=>map.clear()};
}
function loadEngine({ui=false}={}){
  const context=vm.createContext({Date,console,localStorage:memoryStorage(),sessionStorage:memoryStorage(),setTimeout:()=>0,clearTimeout:()=>{},URL,AbortController,
    document:{querySelectorAll:()=>[],querySelector:()=>null,addEventListener:()=>{},getElementById:()=>null,body:{setAttribute:()=>{}}},window:{addEventListener:()=>{}},navigator:{},alert:()=>{}});
  if(!ui){delete context.document;delete context.window;delete context.navigator;}
  const {sources,sourceText}=require('../scripts/source-list.cjs');
  for(const file of sources.filter(f=>f!=='src/ui/app.js')) vm.runInContext(sourceText(root,file),context,{filename:file});
  if(ui){
    const source=fs.readFileSync(path.join(root,'src/ui/app.js'),'utf8');
    vm.runInContext(source.slice(0,source.indexOf('/* ======================== Tab切换'))+'\n'+source.slice(source.lastIndexOf('function temporalDescription(')),context,{filename:'app-functions.js'});
  }
  return {context,run:code=>vm.runInContext(code,context),json:code=>JSON.parse(vm.runInContext('JSON.stringify('+code+')',context))};
}
module.exports={loadEngine,memoryStorage,root};
