const fs=require('node:fs');
const path=require('node:path');
const sources=['vendor/lunar.js','data/cities.json','data/school-prompts.json','src/bazi/data.js','src/bazi/profiles.js','src/calendar/calendar.js','src/calendar/locations.js','src/bazi/scoring.js','src/bazi/engine.js','src/calendar/candidates.js','src/storage/records.js','src/ai/dimensions.js','src/ui/calculation-controls.js','src/ui/app.js'];
function sourceText(root,file){
  const value=fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n?/g,'\n');
  if(file==='data/cities.json')return 'const CITY_DATA='+JSON.stringify(JSON.parse(value))+';';
  if(file==='data/school-prompts.json')return 'const SCHOOL_PROMPTS='+JSON.stringify(JSON.parse(value))+';';
  return value;
}
module.exports={sources,sourceText};
