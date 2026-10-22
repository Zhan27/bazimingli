/** Offline comparison only. Never runs a supplied script or calls an external service. */
const fs=require('node:fs'),path=require('node:path'),api=require('../lib/index.cjs');
const args=process.argv.slice(2),options={};
try{
  for(let i=0;i<args.length;i+=2){
    if(!['--input','--local','--reference','--out'].includes(args[i])||!args[i+1]||Object.hasOwn(options,args[i]))throw new Error('参数无效');options[args[i]]=args[i+1];
  }
  if(!!options['--input']===!!options['--local']||!options['--reference']||!options['--out'])throw new Error('用法：node scripts/compare-reference.cjs (--input birth-input.json | --local snapshot.json) --reference reference.json --out new-report.json');
  const read=file=>{if(fs.statSync(file).size>2*1024*1024)throw new Error('输入文件超过2MB');return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));};
  const provided=read(options['--input']||options['--local']);
  const chart=options['--input']?api.calculateChart(provided):provided.format==='bazimingli-study'?provided.chart:provided;
  const report=api.compareReferenceChart(chart,read(options['--reference']));
  fs.writeFileSync(path.resolve(options['--out']),JSON.stringify(report,null,2)+'\n',{encoding:'utf8',flag:'wx'});
  console.log(`离线对照：${report.summary.same}项一致，${report.summary.different}项差异，${report.summary['not-provided']}项未提供；${report.warnings.length}条口径提示。任一实现均不自动视为标准答案。`);
}catch(e){console.error(e.code==='EEXIST'?'报告已存在，未覆盖。':e.message);process.exitCode=1;}
