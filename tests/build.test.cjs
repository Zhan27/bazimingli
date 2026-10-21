const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const {root}=require('./helpers.cjs');
test('release check detects stale artifacts; secret/syntax failures do not overwrite output',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'bazimingli-build-'));
  try{
    for(const folder of ['src','data','vendor','scripts'])fs.cpSync(path.join(root,folder),path.join(temp,folder),{recursive:true});
    const build=()=>spawnSync(process.execPath,['scripts/build.mjs'],{cwd:temp,encoding:'utf8'});
    let result=build();assert.equal(result.status,0,result.stderr);
    const original=fs.readFileSync(path.join(temp,'命理排盘.html'),'utf8');
    assert.equal(original,fs.readFileSync(path.join(temp,'docs/index.html'),'utf8'));
    assert.ok(original.includes('Copyright (c) 2018 6tail'));
    fs.appendFileSync(path.join(temp,'docs/index.html'),'stale');
    assert.notEqual(spawnSync(process.execPath,['scripts/build.mjs','--check'],{cwd:temp}).status,0);
    const source=path.join(temp,'src/ui/app.js'),saved=fs.readFileSync(source,'utf8');
    const fake='sk-'+'X'.repeat(32);fs.appendFileSync(source,'\nconst accidentalKey="'+fake+'";');
    result=build();assert.notEqual(result.status,0);assert.equal((result.stdout+result.stderr).includes(fake),false);assert.equal(fs.readFileSync(path.join(temp,'命理排盘.html'),'utf8'),original);
    fs.writeFileSync(source,saved+'\nfunction syntaxError( {');result=build();assert.notEqual(result.status,0);assert.equal(fs.readFileSync(path.join(temp,'命理排盘.html'),'utf8'),original);
  }finally{
    const absolute=path.resolve(temp),base=path.resolve(os.tmpdir())+path.sep;
    if(!absolute.startsWith(base)||!path.basename(absolute).startsWith('bazimingli-build-'))throw new Error('Invalid temporary cleanup path');
    fs.rmSync(absolute,{recursive:true,force:true});
  }
});
