const {test}=require('node:test'),assert=require('node:assert/strict');
const api=require('../lib/index.cjs'),{loadEngine}=require('./helpers.cjs');
const input={date:'2024-02-10',unknownTime:true};

test('unknown birth times cannot become definite module, debug or marriage results',()=>{
  for(const time of [undefined,'12:00']){
    const unknown={...input,...(time?{time}:{})},before=JSON.stringify(unknown);
    assert.throws(()=>api.calendarDebug(unknown),/时辰未知/);
    for(const module of ['ziwei','qimen','liuyao'])assert.throws(()=>api.calculateModule(module,unknown),/时辰未知/);
    for(const pair of [[unknown,{date:input.date}],[{date:input.date},unknown]])assert.throws(()=>api.comparePair(...pair),/时辰未知/);
    assert.equal(JSON.stringify(unknown),before);
    assert.equal(api.calculateChart(unknown).kind,'unknown-time');
    assert.ok(api.compareSchools(unknown).every(c=>c.kind==='unknown-time'));
  }
});

test('last supported day retains its valid four hours under UTC-12 and accounts for the whole input day',()=>{
  const chart=api.calculateChart({date:'2099-12-31',unknownTime:true,options:{utcOffsetMinutes:-720}});
  assert.equal(chart.candidates[0].fromClock,'2099-12-31T00:00:00');
  assert.equal(chart.candidates.at(-1).toClock,'2099-12-31T04:00:00');
  const all=[...chart.candidates,...chart.excluded].sort((a,b)=>a.fromClock.localeCompare(b.fromClock));
  assert.equal(all[0].fromClock,'2099-12-31T00:00:00');assert.equal(all.at(-1).toClock,'2100-01-01T00:00:00');
  for(let n=1;n<all.length;n++)assert.equal(all[n-1].toClock,all[n].fromClock);
  assert.ok(chart.excluded.every(c=>c.reason.includes('历法范围')||c.reason.includes('公历范围')));
});

test('candidate offsets, DST and day boundary are validated before segment evaluation',()=>{
  for(const options of [{utcOffsetMinutes:841},{dstMinutes:30},{dayBoundary:'invalid'}]){
    assert.throws(()=>api.calculateChart({...input,options}),/UTC标准时偏移|夏令时修正|未知换日规则/);
  }
  const chart=api.calculateChart({date:'1900-01-31',unknownTime:true,options:{utcOffsetMinutes:840}});
  assert.equal(chart.candidates[0].fromClock,'1900-01-31T06:00:00');
  assert.equal(chart.excluded.at(-1).toClock,'1900-01-31T06:00:00');
});

test('solar-time candidate clock strings preserve exact fractional-second boundaries',()=>{
  const e=loadEngine(),raw=e.json("unknownBirthCandidates(parseCivilDate('2024-02-10'),'87.6°',{trueSolar:true})");
  const chart=api.calculateChart({...input,place:'87.6°',options:{trueSolar:true}});
  assert.ok(raw.candidates.some(c=>c.from%1000!==0));
  for(let n=0;n<raw.candidates.length;n++){
    assert.equal(Date.parse(chart.candidates[n].fromClock+'Z'),raw.candidates[n].from);
    assert.equal(Date.parse(chart.candidates[n].toClock+'Z'),raw.candidates[n].to);
  }
});

test('candidate summaries include excluded clocks and do not claim full-day stability',()=>{
  const e=loadEngine({ui:true});
  const text=e.run("unknownSummary(unknownBirthCandidates(parseCivilDate('1900-01-31'),'',{utcOffsetMinutes:840}),'合成样本')");
  assert.match(text,/排除时段/);assert.match(text,/1900-01-31 00:00:00/);assert.match(text,/1900-01-31 06:00:00/);
  assert.match(text,/有效候选/);
});

test('unknown-time rendering replaces the previous definite-chart input summary',()=>{
  const e=loadEngine({ui:true});
  e.run("document.getElementById=id=>id==='compact-input-summary'?window.summary:(id==='zh-result'?window.result:null);window.summary={textContent:'2024-02-10 · 12:00'};window.result={innerHTML:''};renderUnknownCandidates(unknownBirthCandidates(parseCivilDate('2099-12-31'),'',{utcOffsetMinutes:-720}),'合成样本')");
  assert.equal(e.run('window.summary.textContent'),'2099-12-31 · 时辰未知');
});

test('range-edge matrix covers each input day once and agrees with direct calculation at interval endpoints',()=>{
  const e=loadEngine();
  const checked=e.run(`(()=>{
    let count=0;
    for(const day of ['1900-01-31','2099-12-31'])for(const utcOffsetMinutes of [-720,-300,0,480,840])for(const dstMinutes of [0,60])for(const place of ['', '-180°','87.6°','120°','180°'])for(const dayBoundary of ['zi-chu','zi-zheng']){
      const options={utcOffsetMinutes,dstMinutes,trueSolar:!!place,dayBoundary,preciseTime:true};
      let r;
      try{r=unknownBirthCandidates(parseCivilDate(day),place,options);}catch(error){
        if(!error.message.includes('候选时段均超出'))throw error;
        // This matrix includes a full 32-hour shift: confirm there really are no valid minutes.
        for(let m=0;m<1440;m++){
          const d=civilFromMillis(civilDay(parseCivilDate(day))+m*60000);
          let valid=false;try{calculateBirth(d,hourIndexAt(d),place,options);valid=true;}catch{}
          if(valid)throw new Error('Lost valid minute: '+day+'/'+m+'/'+place+'/'+utcOffsetMinutes);
        }
        continue;
      }
      const segments=[...r.candidates,...r.excluded].sort((a,b)=>a.from-b.from);
      if(segments[0].from!==civilDay(parseCivilDate(day))||segments.at(-1).to!==civilDay(parseCivilDate(day))+86400000)throw new Error('Incomplete day');
      for(let n=0;n<segments.length;n++){
        const c=segments[n];if(n&&segments[n-1].to!==c.from)throw new Error('Gap or overlap');
        for(const ms of [c.from,Math.floor((c.from+c.to-1)/2),c.to-1]){
          const d=civilFromMillis(ms);let value,error;
          try{const t=calculateBirth(d,hourIndexAt(d),place,options);value=[t.yearGZ,t.monthGZ,t.dayGZ,t.hourGZ];}catch(err){error=err;}
          if(c.reason){if(!error)throw new Error('Valid endpoint excluded: '+JSON.stringify({day,place,utcOffsetMinutes,c,ms}));}
          else if(error||JSON.stringify(value)!==JSON.stringify(c.pillars))throw new Error('Candidate mismatch: '+JSON.stringify({day,place,utcOffsetMinutes,c,ms,error:error?.message,value}));
        }
      }
      count++;
    }
    return count;
  })()`);
  assert.ok(checked>=150);
});
