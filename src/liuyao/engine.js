/* Extracted without calculation changes. See docs/ARCHITECTURE.md. */
const BAGUA=["乾","兑","离","震","巽","坎","艮","坤"];

const BAGUA_GLYPH=["","☱","☲","☳","☴","☵","☶",""];

const BAGUA_BIN=[[1,1,1],[0,1,1],[1,0,1],[0,0,1],[1,1,0],[0,1,0],[1,0,0],[0,0,0]];

const LIUSHOU=["父母","兄弟","子孙","妻财","官鬼"];

const LIUSHEN=["青龙","朱雀","勾陈","螣蛇","白虎","玄武"];

const GUA_NAMES={};

(function(){
  const names=[
    [0,0,'乾为天'],[0,1,'天泽履'],[0,2,'天火同人'],[0,3,'天雷无妄'],[0,4,'天风姤'],[0,5,'天水讼'],[0,6,'天山遁'],[0,7,'天地否'],
    [1,0,'泽天夬'],[1,1,'兑为泽'],[1,2,'泽火革'],[1,3,'泽雷随'],[1,4,'泽风大过'],[1,5,'泽水困'],[1,6,'泽山咸'],[1,7,'泽地萃'],
    [2,0,'火天大有'],[2,1,'火泽睽'],[2,2,'离为火'],[2,3,'火雷噬嗑'],[2,4,'火风鼎'],[2,5,'火水未济'],[2,6,'火山旅'],[2,7,'火地晋'],
    [3,0,'雷天大壮'],[3,1,'雷泽归妹'],[3,2,'雷火丰'],[3,3,'震为雷'],[3,4,'雷风恒'],[3,5,'雷水解'],[3,6,'雷山小过'],[3,7,'雷地豫'],
    [4,0,'风天小畜'],[4,1,'风泽中孚'],[4,2,'风火家人'],[4,3,'风雷益'],[4,4,'巽为风'],[4,5,'风水涣'],[4,6,'风山渐'],[4,7,'风地观'],
    [5,0,'水天需'],[5,1,'水泽节'],[5,2,'水火既济'],[5,3,'水雷屯'],[5,4,'水风井'],[5,5,'坎为水'],[5,6,'水山蹇'],[5,7,'水地比'],
    [6,0,'山天大畜'],[6,1,'山泽损'],[6,2,'山火贲'],[6,3,'山雷颐'],[6,4,'山风蛊'],[6,5,'山水蒙'],[6,6,'艮为山'],[6,7,'山地剥'],
    [7,0,'地天泰'],[7,1,'地泽临'],[7,2,'地火明夷'],[7,3,'地雷复'],[7,4,'地风升'],[7,5,'地水师'],[7,6,'地山谦'],[7,7,'坤为地']
  ];
  names.forEach(n=>{ GUA_NAMES[n[0]*8+n[1]]=n[2]; });
})();

function lyDerived(upGua,downGua){
  const six=[...[...BAGUA_BIN[downGua]].reverse(),...[...BAGUA_BIN[upGua]].reverse()]; // 初→上
  const find=(arr)=>BAGUA_BIN.findIndex(b=>JSON.stringify(b)===JSON.stringify(arr));
  const huDown=find([six[3],six[2],six[1]]);
  const huUp=find([six[4],six[3],six[2]]);
  const cuo=six.map(x=>1-x);
  const cuoD=find(cuo.slice(0,3).reverse());
  const cuoU=find(cuo.slice(3,6).reverse());
  const zong=[...six].reverse();
  const zongD=find(zong.slice(0,3).reverse());
  const zongU=find(zong.slice(3,6).reverse());
  return {huU:huUp,huD:huDown,cuoU,cuoD,zongU,zongD};
}

function getNaJia(up,down){
  // 纳甲(京房法,初爻→上爻): 内卦纳甲/外卦纳壬等
  const na={
    0:[[0,0],[0,2],[0,4],[8,6],[8,8],[8,10]], // 乾: 甲子甲寅甲辰 壬午壬申壬戌
    1:[[3,5],[3,3],[3,1],[3,11],[3,9],[3,7]], // 兑: 丁巳丁卯丁丑 丁亥丁酉丁未
    2:[[5,3],[5,1],[5,11],[5,9],[5,7],[5,5]], // 离: 己卯己丑己亥 己酉己未己巳
    3:[[6,0],[6,2],[6,4],[6,6],[6,8],[6,10]], // 震: 庚子庚寅庚辰 庚午庚申庚戌
    4:[[7,1],[7,11],[7,9],[7,7],[7,5],[7,3]], // 巽: 辛丑辛亥辛酉 辛未辛巳辛卯
    5:[[4,2],[4,4],[4,6],[4,8],[4,10],[4,0]], // 坎: 戊寅戊辰戊午 戊申戊戌戊子
    6:[[2,4],[2,6],[2,8],[2,10],[2,0],[2,2]], // 艮: 丙辰丙午丙申 丙戌丙子丙寅
    7:[[1,7],[1,5],[1,3],[9,1],[9,11],[9,9]]  // 坤: 乙未乙巳乙卯 癸丑癸亥癸酉
  };
  const downNa=na[down].slice(0,3); // 下卦三爻(初二三)
  const upNa=na[up].slice(3,6);     // 上卦三爻(四五上)
  return [...downNa,...upNa]; // 六爻从下到上
}

function getLiuQin(zhi,downGua){
  // 六亲: 以卦宫五行定我,看地支五行生克
  const gongWX={0:3,1:3,2:1,3:0,4:0,5:4,6:2,7:2}; // 卦宫五行(乾兑金,离火,震巽木,坎水,艮坤土)
  const me=gongWX[downGua]!==undefined?gongWX[downGua]:0;
  const zhiWX=ZHI_WX[zhi];
  if(me===zhiWX) return "兄弟";
  if((me+1)%5===zhiWX) return "子孙";
  if((me+2)%5===zhiWX) return "妻财";
  if((me+3)%5===zhiWX) return "官鬼";
  if((me+4)%5===zhiWX) return "父母";
  return "兄弟";
}

function buildShiYingTable(){
  const bin=BAGUA_BIN;
  const table={};
  const chgList=[[0],[0,1],[0,1,2],[0,1,2,3],[0,1,2,3,4],[0,1,2,4],[4]];
  const shiList=[1,2,3,4,5,4,3];
  for(let g=0;g<8;g++){
    const b=bin[g]; // [上,中,下]
    const base=[b[2],b[1],b[0],b[2],b[1],b[0]]; // 六爻初~上: 下卦初中上+上卦初中上
    // 本宫
    table[g*8+g]={shi:6,ying:3,gong:g};
    chgList.forEach((chg,idx)=>{
      const six=[...base];
      chg.forEach(i=>six[i]=1-six[i]);
      const d=[six[2],six[1],six[0]]; // 下卦[上,中,下]
      const u=[six[5],six[4],six[3]]; // 上卦[上,中,下]
      const down=bin.findIndex(x=>JSON.stringify(x)===JSON.stringify(d));
      const up=bin.findIndex(x=>JSON.stringify(x)===JSON.stringify(u));
      table[up*8+down]={shi:shiList[idx],ying:shiList[idx]===1?4:shiList[idx]===2?5:shiList[idx]===3?6:shiList[idx]===4?1:2,gong:g};
    });
  }
  return table;
}

const SHIYING_TABLE=buildShiYingTable();

function getShiYing(up,down){
  // 完整京房八宫世应表
  return SHIYING_TABLE[up*8+down]||{shi:3,ying:6,gong:up};
}

function calculateLiuyao({mode=0,dateStr,hourIdx=0,numStr='',yaoSeq=[]}){
  if(![0,1,2].includes(mode)||!Number.isInteger(hourIdx)||hourIdx<0||hourIdx>11)throw new RangeError('六爻模式或时辰无效');
  if(mode===2&&(!Array.isArray(yaoSeq)||yaoSeq.length!==6||yaoSeq.some(n=>!Number.isInteger(n)||n<0||n>3)))throw new RangeError('摇卦须为六个0至3的整数');
  if(mode===1){const nums=numStr.trim().split(/[\s,，]+/).map(Number);if(nums.length!==3||nums.some(n=>!Number.isSafeInteger(n)||n<0))throw new RangeError('请输入三个非负整数');}
const lyYaoSeq=yaoSeq;
let upGua,downGua,dongYao=0,dayGan=0,sixYao,changedSix,dongMarks=[];
  if(mode===2){
    // 铜钱摇卦: 从初爻到上爻
    if(!lyYaoSeq||lyYaoSeq.length!==6){throw new RangeError('请先摇完六爻（摇6次或点"自动摇完"）');}
    sixYao=lyYaoSeq.map(n=>n>=2?1:0); // 3/2背=阳, 1/0背=阴
    dongMarks=lyYaoSeq.map(n=>(n===3||n===0)?1:0);
    changedSix=[...sixYao];
    let firstDong=-1;
    dongMarks.forEach((v,i)=>{ if(v){ if(firstDong<0) firstDong=i; changedSix[i]=1-changedSix[i]; } });
    dongYao=firstDong+1; // 1-6, 静卦=0
    downGua=BAGUA_BIN.findIndex(b=>JSON.stringify(b)===JSON.stringify(sixYao.slice(0,3).reverse()));
    upGua=BAGUA_BIN.findIndex(b=>JSON.stringify(b)===JSON.stringify(sixYao.slice(3,6).reverse()));
    if(dateStr){ const dd=parseCivilDate(dateStr); if(!isNaN(dd)) dayGan=getDayGZ(dd)[0]; }
  }else if(mode===1){
    const nums=numStr.trim().split(/[\s,，]+/).map(Number).filter(n=>!isNaN(n));
    if(nums.length<3){throw new RangeError('请输入三个数字');}
    upGua=nums[0]%8; downGua=nums[1]%8; dongYao=(nums[2]%6)||6;
    sixYao=[...[...BAGUA_BIN[downGua]].reverse(),...[...BAGUA_BIN[upGua]].reverse()];
    dongMarks=[0,0,0,0,0,0]; dongMarks[dongYao-1]=1;
    changedSix=[...sixYao]; changedSix[dongYao-1]=1-changedSix[dongYao-1];
    if(dateStr){ const dd=parseCivilDate(dateStr); if(!isNaN(dd)) dayGan=getDayGZ(dd)[0]; }
  }else{
    if(!dateStr){throw new RangeError('请选择日期');}
    const [y,m,d]=dateStr.split('-').map(Number);
    const date=parseCivilDate(dateStr);
    const lunar=solar2lunar(date);
    const sum=lunar.year%100+lunar.month+lunar.day;
    upGua=sum%8; downGua=(sum+lunar.day)%8; dongYao=(sum+hourIdx)%6||6;
    sixYao=[...[...BAGUA_BIN[downGua]].reverse(),...[...BAGUA_BIN[upGua]].reverse()];
    dongMarks=[0,0,0,0,0,0]; dongMarks[dongYao-1]=1;
    changedSix=[...sixYao]; changedSix[dongYao-1]=1-changedSix[dongYao-1];
    dayGan=getDayGZ(date)[0];
  }
  // 变卦上下
  const changeDown=BAGUA_BIN.findIndex(b=>JSON.stringify(b)===JSON.stringify(changedSix.slice(0,3).reverse()));
  const changeUp=BAGUA_BIN.findIndex(b=>JSON.stringify(b)===JSON.stringify(changedSix.slice(3,6).reverse()));
  return {upGua,downGua,dongYao,changeUp,changeDown,sixYao,changedSix,dongMarks,hourIdx,dateStr,dayGan,mode,yaoSeq:lyYaoSeq};
}
