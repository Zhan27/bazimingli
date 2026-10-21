import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+(pathname==='/'?'/命理排盘.html':pathname));
    if(!path.startsWith(root+sep)||pathname.includes('/.git')){res.writeHead(403);res.end();return;}
    const data=await readFile(path);
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json'})[extname(path)]||'application/octet-stream');
    res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(8766,'127.0.0.1',()=>console.log('Test server http://127.0.0.1:8766'));
