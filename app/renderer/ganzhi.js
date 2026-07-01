// ===== 干支历法 v3 — 系统 Intl API 提供农历日期和年干支 =====
// 日干支、时干支、月干支、节气仍由算法计算

const TIAN_GAN = '甲乙丙丁戊己庚辛壬癸';
const DI_ZHI   = '子丑寅卯辰巳午未申酉戌亥';
const SHENG_XIAO = '鼠牛虎兔龙蛇马羊猴鸡狗猪';
const YUE_FEN  = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];

// 日干支：1900-01-01 = 甲戌日 (ord=10)
function dayGZ(dt){
  const base=Date.UTC(1900,0,1), tgt=Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate());
  let o=(10+Math.round((tgt-base)/86400000))%60; if(o<0)o+=60;
  return {g:TIAN_GAN[o%10],z:DI_ZHI[o%12],o};
}

// 时干支：五鼠遁
function hourGZ(dg,h){
  const z=Math.floor((h+1)/2)%12;
  const m={'甲':0,'己':0,'乙':2,'庚':2,'丙':4,'辛':4,'丁':6,'壬':6,'戊':8,'癸':8};
  return {g:TIAN_GAN[(m[dg]+z)%10],z:DI_ZHI[z],zn:DI_ZHI[z]+'时'};
}

// 月干支：节气为界 + 五虎遁
const JIE_QI_NAMES=['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
const JIE_QI_OFFSETS=[5,20,35,50,65,80,95,110,125,140,155,170,185,200,215,230,245,260,275,290,305,320,335,350];
// 节气索引→干支月: 0,1→12(丑月), 2,3→1(寅月), ...
const JQ_TO_MONTH = [12,12,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11];

function getJieQi(dt){
  const y=dt.getFullYear(), leap=(y%4===0&&y%100!==0)||(y%400===0);
  const doy=Math.floor((dt-new Date(y,0,1))/86400000);
  let r=null;
  for(let i=0;i<24;i++){
    let o=JIE_QI_OFFSETS[i]; if(i>=12&&leap)o+=1;
    if(doy>=o) r={n:JIE_QI_NAMES[i],i};
  }
  if(!r) r={n:'冬至',i:22};
  let off=JIE_QI_OFFSETS[r.i]; if(r.i>=12&&leap)off+=1;
  const match=Math.abs(doy-off)<=1;
  return {name:r.n,index:r.i,isToday:match};
}

function monthGZ(yg, jqIdx){
  const nm=JQ_TO_MONTH[jqIdx];
  const m={'甲':2,'己':2,'乙':4,'庚':4,'丙':6,'辛':6,'丁':8,'壬':8,'戊':0,'癸':0};
  return {g:TIAN_GAN[(m[yg]+nm-1)%10],z:DI_ZHI[(1+nm)%12]};
}

// 农历日期 → 系统 Intl API
function getLunarFromIntl(dt){
  try {
    const parts = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      year:'numeric', month:'numeric', day:'numeric'
    }).formatToParts(dt);
    let year, month='', day, isLeap=false;
    for (const p of parts) {
      if (p.type === 'relatedYear') year = parseInt(p.value);
      if (p.type === 'month') { month = p.value; if (month.startsWith('闰')) { isLeap=true; month=month.slice(1); } }
      if (p.type === 'day') day = parseInt(p.value);
    }
    // Parse Chinese month number: "正月"→1, "五月"→5, "十一月"→11, "十二月"→12
    const chM = {'正月':1,'二月':2,'三月':3,'四月':4,'五月':5,'六月':6,'七月':7,'八月':8,'九月':9,'十月':10,'十一月':11,'十二月':12};
    let mNum = chM[month] || 0;
    return { lunarYear:year, month:mNum, day, isLeap };
  } catch(e) {
    return null;
  }
}

// 立春表 1900-2099
const LICHUN={1900:[2,5],1901:[2,5],1902:[2,5],1903:[2,5],1904:[2,5],1905:[2,5],1906:[2,5],1907:[2,5],1908:[2,5],1909:[2,5],1910:[2,5],1911:[2,5],1912:[2,5],1913:[2,5],1914:[2,5],1915:[2,5],1916:[2,5],1917:[2,4],1918:[2,4],1919:[2,5],1920:[2,5],1921:[2,4],1922:[2,4],1923:[2,5],1924:[2,5],1925:[2,4],1926:[2,4],1927:[2,5],1928:[2,5],1929:[2,4],1930:[2,4],1931:[2,5],1932:[2,5],1933:[2,4],1934:[2,4],1935:[2,5],1936:[2,5],1937:[2,4],1938:[2,4],1939:[2,5],1940:[2,5],1941:[2,4],1942:[2,4],1943:[2,5],1944:[2,5],1945:[2,4],1946:[2,4],1947:[2,5],1948:[2,5],1949:[2,4],1950:[2,4],1951:[2,5],1952:[2,5],1953:[2,4],1954:[2,4],1955:[2,5],1956:[2,5],1957:[2,4],1958:[2,4],1959:[2,5],1960:[2,5],1961:[2,4],1962:[2,4],1963:[2,4],1964:[2,5],1965:[2,4],1966:[2,4],1967:[2,4],1968:[2,5],1969:[2,4],1970:[2,4],1971:[2,4],1972:[2,5],1973:[2,4],1974:[2,4],1975:[2,5],1976:[2,5],1977:[2,4],1978:[2,4],1979:[2,4],1980:[2,5],1981:[2,4],1982:[2,4],1983:[2,4],1984:[2,4],1985:[2,4],1986:[2,4],1987:[2,5],1988:[2,5],1989:[2,4],1990:[2,4],1991:[2,4],1992:[2,4],1993:[2,4],1994:[2,4],1995:[2,4],1996:[2,4],1997:[2,4],1998:[2,4],1999:[2,4],2000:[2,4],2001:[2,4],2002:[2,4],2003:[2,4],2004:[2,4],2005:[2,4],2006:[2,4],2007:[2,4],2008:[2,4],2009:[2,4],2010:[2,4],2011:[2,4],2012:[2,4],2013:[2,4],2014:[2,4],2015:[2,4],2016:[2,4],2017:[2,3],2018:[2,4],2019:[2,4],2020:[2,4],2021:[2,3],2022:[2,4],2023:[2,4],2024:[2,4],2025:[2,3],2026:[2,4],2027:[2,4],2028:[2,4],2029:[2,3],2030:[2,4],2031:[2,4],2032:[2,4],2033:[2,3],2034:[2,4],2035:[2,4],2036:[2,4],2037:[2,3],2038:[2,4],2039:[2,4],2040:[2,4],2041:[2,3],2042:[2,4],2043:[2,4],2044:[2,4],2045:[2,3],2046:[2,4],2047:[2,4],2048:[2,4],2049:[2,3],2050:[2,4],2051:[2,4],2052:[2,4],2053:[2,3],2054:[2,4],2055:[2,4],2056:[2,4],2057:[2,3],2058:[2,4],2059:[2,4],2060:[2,4],2061:[2,3],2062:[2,4],2063:[2,4],2064:[2,4],2065:[2,3],2066:[2,4],2067:[2,4],2068:[2,4],2069:[2,3],2070:[2,4],2071:[2,4],2072:[2,4],2073:[2,3],2074:[2,4],2075:[2,4],2076:[2,4],2077:[2,3],2078:[2,4],2079:[2,4],2080:[2,4],2081:[2,3],2082:[2,4],2083:[2,4],2084:[2,4],2085:[2,3],2086:[2,4],2087:[2,4],2088:[2,4],2089:[2,3],2090:[2,4],2091:[2,4],2092:[2,4],2093:[2,3],2094:[2,4],2095:[2,4],2096:[2,4],2097:[2,3],2098:[2,4],2099:[2,4]};

// 年干支 → 直接取系统 ICU yearName
function yearGZ(y,m,d){
  const lc=LICHUN[y]||[2,4];
  if(m<lc[0]||(m===lc[0]&&d<lc[1])) y--;
  const o=((y-4)%60+60)%60;
  return {g:TIAN_GAN[o%10],z:DI_ZHI[o%12],o,sx:SHENG_XIAO[o%12]};
}

// 农历日→中文
function nongLiDayCN(d){
  if(d===1)return'初一';if(d===2)return'初二';if(d===3)return'初三';
  if(d===4)return'初四';if(d===5)return'初五';if(d===6)return'初六';
  if(d===7)return'初七';if(d===8)return'初八';if(d===9)return'初九';
  if(d===10)return'初十';if(d<=19)return'十'+'一二三四五六七八九'[d-11];
  if(d===20)return'二十';if(d<=29)return'廿'+'一二三四五六七八九'[d-21];
  if(d===30)return'三十';return d+'';
}

// 主函数
function calcGanZhi(dt){
  const y=dt.getFullYear(), m=dt.getMonth()+1, d=dt.getDate(), h=dt.getHours();
  const ygz=yearGZ(y,m,d);
  const dgz=dayGZ(dt);
  const jq=getJieQi(dt);
  const mgz=monthGZ(ygz.g, jq.index);
  const hgz=hourGZ(dgz.g, h);
  const lu=getLunarFromIntl(dt);
  if(!lu) return {dateStr:'error'};
  return {
    year:{g:ygz.g,z:ygz.z,o:ygz.o,sz:ygz.sx},
    month:{g:mgz.g,z:mgz.z},
    day:{g:dgz.g,z:dgz.z,o:dgz.o},
    hour:{g:hgz.g,z:hgz.z,zn:hgz.zn},
    jieQi:jq,
    nongLi:{m:lu.month,d:lu.day,mn:YUE_FEN[lu.month-1],isLeap:lu.isLeap},
    dateStr:y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')
  };
}

function formatGanZhi(gz){
  return gz.year.g+gz.year.z+'年 '+gz.month.g+gz.month.z+'月 '+gz.day.g+gz.day.z+'日 '+gz.hour.g+gz.hour.z+'时';
}
