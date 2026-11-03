const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('./helpers.cjs');

test('an older backup read cannot overwrite a newer selected backup',()=>{
  const engine=loadEngine({ui:true});
  const reads=[];
  const notices=[];
  engine.context.alert=message=>notices.push(message);
  engine.context.FileReader=class {
    readAsText(file){reads.push(()=>{this.result=file.json;this.onload();});}
  };
  engine.run(`for(const id of ['older','newer']){
    const record={id,dateStr:'2024-02-10',hourIdx:5};
    importRecords({files:[{size:100,json:JSON.stringify({version:'v5',ml_records:[record]})}],value:id});
  }`);
  reads[1]();
  reads[0]();
  assert.equal(engine.json('readStoredRecords(REC_KEY)')[0].id,'newer');
  assert.equal(notices.length,1);
});
