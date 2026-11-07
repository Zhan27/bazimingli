// Reads saved responses only. Refuses to replace existing inputs or reports.
const fs=require('node:fs');
const {evaluateResponses,createExample,MAX_BYTES}=require('../lib/ai-evaluation.cjs');
function main(args){
  if(args[0]==='--example'&&args.length===2){
    fs.writeFileSync(args[1],JSON.stringify(createExample(),null,2)+'\n',{flag:'wx'});
    console.log('Wrote synthetic examples. No model requests.');
    return;
  }
  if(args.length!==2)throw new Error('Usage: node scripts/evaluate-ai-responses.cjs input.json report.json | --example sample.json');
  const [input,output]=args,stat=fs.statSync(input);
  if(!stat.isFile()||stat.size>MAX_BYTES)throw new RangeError('Input must be a file no larger than 20 MiB');
  let data;
  try{data=JSON.parse(fs.readFileSync(input,'utf8').replace(/^\uFEFF/,''));}
  catch{throw new Error('Input could not be read as JSON');}
  const report=evaluateResponses(data);
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(report.summary));
}
if(require.main===module){try{main(process.argv.slice(2));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={main};
