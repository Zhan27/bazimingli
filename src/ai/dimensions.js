/* Pure parser shared by streaming and pasted AI replies. No DOM or HTML parsing.
 * Bracket headings may be inline; numbered fallback headings require a line start.
 * Sections such as 【2026年】 remain part of their dimension, never a dimension ID.
 */
function parseAiDimensions(input){
  const text=String(input||'').replace(/\r\n?/g,'\n');
  if(text.length>1000000) throw new RangeError('AI回复过长（最多100万字符）');
  const sections=Object.create(null), duplicates=[], markers=[];
  const bracket=/(?:\*\*)?[【\[]\s*(\d{1,2})\s*[】\]](?:\*\*)?/g;
  let m;
  while((m=bracket.exec(text))) markers.push({index:m.index,end:bracket.lastIndex,n:Number(m[1])});
  if(!markers.length){
    const numbered=/^\s*(?:#{1,6}\s*)?(?:\*\*)?(\d{1,2})[.．、）)]\s*/gm;
    while((m=numbered.exec(text))) markers.push({index:m.index,end:numbered.lastIndex,n:Number(m[1])});
  }
  markers.forEach((mark,i)=>{
    if(mark.n<1||mark.n>18) return;
    let body=text.slice(mark.end,i+1<markers.length?markers[i+1].index:text.length);
    // Independent supplementary sections are rendered separately by the UI.
    body=body.split(/【(?:流[1-5]|紫微专断)】/)[0].trim();
    if(!body) return;
    if(sections[mark.n]){ duplicates.push(mark.n); sections[mark.n]+='\n'+body; }
    else sections[mark.n]=body;
  });
  const missing=Array.from({length:18},(_,i)=>i+1).filter(n=>!sections[n]);
  return {sections,missing,duplicates};
}
