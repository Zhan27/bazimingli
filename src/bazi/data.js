/* ======================== 基础数据 ======================== */
const GAN=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const ZHI=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const WUXING=["木","火","土","金","水"];
const WUXING_CLS={木:"mu",火:"huo",土:"tu",金:"jin",水:"shui"};
const GAN_WX=[0,0,1,1,2,2,3,3,4,4]; // 甲乙木...
const GAN_YIN=[1,0,1,0,1,0,1,0,1,0]; // 甲阳乙阴...
const ZHI_WX=[4,2,0,0,2,1,1,2,3,3,2,4]; // 子水丑土寅木卯木辰土巳火午火未土申金酉金戌土亥水
const ZHI_HIDDEN=[ // 地支藏干(本气/中气/余气,子平标准)
[9],[5,9,7],[0,2,4],[1],[4,1,9],[2,4,6],[3,5],[5,3,1],[6,8,4],[7],[4,7,3],[8,0]
// 子癸 丑己癸辛 寅甲丙戊 卯乙 辰戊乙癸 巳丙戊庚 午丁己 未己丁乙 申庚壬戊 酉辛 戌戊辛丁 亥壬甲
];
const ZHI_HIDDEN_NAME=[["癸"],["己癸辛"],["甲丙戊"],["乙"],["戊乙癸"],["丙戊庚"],["丁己"],["己丁乙"],["庚壬戊"],["辛"],["戊辛丁"],["壬甲"]];
const SHISHEN_NAME=["比肩","劫财","食神","伤官","偏财","正财","七杀","正官","偏印","正印"];
// 十神: 以日干为我,看与某干的关系
function tenGod(dayGan,targetGan){
  if(!Number.isInteger(dayGan)||!Number.isInteger(targetGan)||dayGan<0||dayGan>9||targetGan<0||targetGan>9)throw new RangeError('十神映射需要0至9的天干索引');
  const a=dayGan,b=targetGan;
  const da=GAN_WX[a],db=GAN_WX[b];
  const sameWX=da===db;
  const yinYang=GAN_YIN[a]===GAN_YIN[b]; // 同阴阳
  if(a===b) return 0; // 比肩
  if(sameWX && !yinYang) return 1; // 劫财
  // 我生
  const sheng=(da+1)%5; // 木生火...
  if(db===sheng){ return yinYang?2:3; } // 食神/伤官
  // 我克
  const ke=(da+2)%5;
  if(db===ke){ return yinYang?4:5; } // 偏财/正财
  // 克我
  const keMe=(da+3)%5;
  if(db===keMe){ return yinYang?6:7; } // 七杀/正官
  // 生我
  const shengMe=(da+4)%5;
  if(db===shengMe){ return yinYang?8:9; } // 偏印/正印
  return 0;
}
// 纳音
const NAYIN=[
"海中金","海中金","炉中火","炉中火","大林木","大林木","路旁土","路旁土","剑锋金","剑锋金",
"山头火","山头火","涧下水","涧下水","城墙土","城墙土","白蜡金","白蜡金","杨柳木","杨柳木",
"井泉水","井泉水","屋上土","屋上土","霹雳火","霹雳火","松柏木","松柏木","长流水","长流水",
"沙中金","沙中金","山下火","山下火","平地木","平地木","壁上土","壁上土","金箔金","金箔金",
"覆灯火","覆灯火","天河水","天河水","大驿土","大驿土","钗钏金","钗钏金","桑柘木","桑柘木",
"大溪水","大溪水","沙中土","沙中土","天上火","天上火","石榴木","石榴木","大海水","大海水"
];
function nayinOf(g,z){ return NAYIN[gzIndex(g,z)]; }
// 纳音索引=NAYIN数组直接索引(0-59,每个纳音重复2次对应六十甲子)
function nayinIndex(g,z){ // 返回NAYIN数组索引(0-59)
  return gzIndex(g,z);
}
function gzIndex(g,z){ // 干支组合索引0-59,要求g%2==z%2
  // idx ≡ z (mod 12) 且 idx ≡ g (mod 10), 用中国剩余定理求解
  const k=(Math.floor((g-z)/2)%5+5)%5;
  return z+12*k;
}
// 优化: 60个干支结果全量预计算缓存(纯函数,避免反复分配数组)
const GZ_CACHE=Array.from({length:60},(_,i)=>[i%10,i%12]);
function indexToGZ(i){ return GZ_CACHE[(i%60+60)%60]; }

