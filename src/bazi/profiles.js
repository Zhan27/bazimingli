/* Versioned application rules, not claims of universal agreement among schools.
 * Historical prompt roles/guides live in data/school-prompts.json. */
function freezeRules(value){
  Object.values(value).forEach(v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v))freezeRules(v);});
  return Object.freeze(value);
}
const RULE_VERSION='5.19.1';
const STRENGTH_RULES=freezeRules({id:'legacy-strength-v1',
  month:{same:3,resource:2.5,output:-1.5,officer:-2.5,wealth:-1.5},
  root:{same:[1.5,0.5,0.25],resource:[1,0.3,0.15],dayBonus:0.8,monthBonus:0.3},
  momentum:{rooted:1,floating:0.5}, thresholds:{following:1.5,weak:6,balanced:10,strong:14}});
const RULE_PROFILES=freezeRules([
  {id:0,key:'combined',name:'综合多流派',useStrategy:'balance-climate',climatePriority:true,geographicClimate:true,focus:'旺衰、格局、调候并列核对，明确规则冲突'},
  {id:1,key:'balance',name:'旺衰平衡派',useStrategy:'balance',climatePriority:false,geographicClimate:false,focus:'以得令、通根、得势为共同事实，扶抑取用，不由调候覆盖'},
  {id:2,key:'image',name:'盲派象法',useStrategy:'image-reference',climatePriority:false,geographicClimate:false,focus:'主宾、做功、刑冲合害为解释主线；量化旺衰和扶抑用神仅作参考'},
  {id:3,key:'structure',name:'子平格局派',useStrategy:'structure-reference',climatePriority:false,geographicClimate:false,focus:'月令本气十神与透干构成结构事实；扶抑用神仅作参考，成败救应另论'},
  {id:4,key:'climate',name:'穷通调候派',useStrategy:'climate-first',climatePriority:true,geographicClimate:true,focus:'冬火夏水优先；与扶抑冲突时并列显示，不掩盖另一条取用路径'}
].map(p=>({...p,version:RULE_VERSION,strengthRule:STRENGTH_RULES.id,dayBoundary:'zi-chu',wxMode:'stems-main-qi',yearBoundary:'lichun-instant',monthBoundary:'jie-instant'})));
const SCHOOLS=RULE_PROFILES.map(p=>p.name);
function getRuleProfile(id=0){
  const n=Number(id);
  if(!Number.isInteger(n)||!RULE_PROFILES[n])throw new RangeError('未知流派规则');
  return RULE_PROFILES[n];
}
function aiBuildSchool(id){
  const p=getRuleProfile(id), prompt=JSON.parse(JSON.stringify(SCHOOL_PROMPTS[p.id]));
  prompt.role+='\n【当前规则配置】'+JSON.stringify({key:p.key,version:p.version,strengthRule:p.strengthRule,useStrategy:p.useStrategy,focus:p.focus});
  return prompt;
}
function dayBoundaryLabel(rule){
  if(!['zi-chu','zi-zheng'].includes(rule))throw new RangeError('未知换日规则');
  return rule==='zi-chu'?'子初23:00换日（日柱与时干一起推进）':'子正00:00换日（日柱与时干均到午夜推进）';
}
