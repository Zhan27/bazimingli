const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {sources,sourceText}=require('../scripts/source-list.cjs');
const root=path.resolve(__dirname,'..'),context=vm.createContext({Date,console});
for(const file of sources.filter(f=>!f.startsWith('src/ui/')&&!f.startsWith('src/storage/')&&!f.startsWith('src/ai/')))vm.runInContext(sourceText(root,file),context,{filename:file});
const names=['calculateChart','compareChartFacts','compareSchools','batchCalculate','calendarDebug','chartEvidenceGraph','validateRulePack','calculateModule','comparePair','chartStudyFacts','chartStudyMonths','createStudySnapshot','normalizeReferenceChart','compareReferenceChart'];
module.exports=Object.fromEntries(names.map(name=>[name,vm.runInContext(name,context)]));
