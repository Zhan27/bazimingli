function normalizeLocationName(value){return String(value||'').trim().toLocaleLowerCase('en-US').replace(/[\s/／,，·]+/g,'');}
const locationIndex=new Map(), locationById=new Map();
CITY_DATA.cities.forEach(city=>{
  locationById.set(city.id,city);
  const names=new Set([city.name,...city.aliases,locationLabel(city)]);
  names.forEach(name=>[name,city.region+name].forEach(key=>{
    const normalized=normalizeLocationName(key);
    if(!locationIndex.has(normalized))locationIndex.set(normalized,new Set());
    locationIndex.get(normalized).add(city.id);
  }));
});
function resolveLocation(value){
  if(locationById.has(value))return locationById.get(value);
  const ids=[...(locationIndex.get(normalizeLocationName(value))||[])];
  if(ids.length===1)return locationById.get(ids[0]);
  if(ids.length>1)throw new RangeError('出生地名称不唯一，请选择省/市或GeoNames ID：'+ids.slice(0,5).map(id=>{const c=locationById.get(id);return c.region+'/'+c.name+' ['+c.longitude.toFixed(5)+','+c.latitude.toFixed(5)+']';}).join('、'));
  throw new RangeError('真太阳时需要标准城市或经度（例如 87.6°）；请从城市列表选择或填写经度');
}
function resolveLongitude(place){
  const text=String(place||'').trim();
  if(locationIndex.get(normalizeLocationName(text))?.size===1)return resolveLocation(text).longitude;
  const m=text.match(/(?:^|\s|[（(])(?:经度[:：]?\s*)?([+-]?\d+(?:\.\d+)?)\s*°/);
  if(m){const lon=Number(m[1]);if(lon < -180||lon>180)throw new RangeError('经度须在-180°至180°之间');return lon;}
  return resolveLocation(text).longitude;
}
function locationLabel(c){return c.region+'/'+c.name+' ['+c.longitude.toFixed(5)+','+c.latitude.toFixed(5)+']';}
