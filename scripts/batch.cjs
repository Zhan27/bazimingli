// Explicitly supplied, authorized local data only. No network or telemetry.
const fs=require('node:fs'),{batchCalculate}=require('../lib/index.cjs');
const [input,output]=process.argv.slice(2);
if(!input||!output){console.error('Usage: node scripts/batch.cjs input.json report.json');process.exitCode=2;}
else {const rows=JSON.parse(fs.readFileSync(input,'utf8'));const report={schemaVersion:'1.0.0',source:'local input supplied by operator',rows:batchCalculate(rows)};fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log('Wrote',report.rows.length,'results; no network requests');}
