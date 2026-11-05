'use strict';
const el = id => document.getElementById(id);
const option = (value, label) => new Option(label, value);
const fmt = (n, digits = 2) => n.toLocaleString('tr-TR', {maximumFractionDigits: digits});
const names = new Intl.DisplayNames(['tr'], {type:'region'});
const localNames = {TUR:'Türkiye', JPN:'Japonya', NGA:'Nijerya'};
function country(code) {
  const iso = index.iso2?.[code];
  return localNames[code] || (iso && /^[A-Z]{2}$/.test(iso) ? names.of(iso) : index.countries[code]) || code;
}
let index, catalog, births, plotVersion = 0;
const cache = new Map();
async function json(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Veri dosyası açılamadı.');
  return response.json();
}
function node(tag, text, cls) {
  const out = document.createElement(tag);
  if (text !== undefined) out.textContent = text;
  if (cls) out.className = cls;
  return out;
}
function link(text, href) {
  const a = node('a', text); a.href = href; return a;
}
async function plot() {
  const version = ++plotVersion;
  const code = el('metric').value;
  const ids = [...new Set([el('a').value,el('b').value])];
  if (!cache.has(code)) cache.set(code, json('data/'+code+'.json'));
  let data;
  try { data = await cache.get(code); }
  catch { cache.delete(code); if (version===plotVersion) el('chart').textContent='Veri yüklenemedi. Göstergeyi yeniden seçin.'; return; }
  if (version!==plotVersion) return;
  const [label,,unit]=index.metrics[code];
  const sets=ids.map(id=>Object.entries(data[id]||{}).map(([y,v])=>[Number(y),v]).sort((a,b)=>a[0]-b[0]));
  const points=sets.flat();
  const chart=el('chart'); chart.replaceChildren(node('h3',label+(unit?' · '+unit:''),'chart-title'));
  el('rows').replaceChildren();
  if (!points.length) {chart.append(node('p','Bu seçim için kayıt bulunmuyor.'));return;}
  const scores=node('div',undefined,'scores');
  const colors=['#38674c','#8058a3'];
  sets.forEach((set,i)=>{
    const box=node('span'), dot=node('i',undefined,'swatch');dot.style.background=colors[i];
    const last=set.at(-1);
    box.append(dot, document.createTextNode(country(ids[i])+' '),node('b',last?fmt(last[1]):'—'),document.createTextNode(last?' · '+last[0]:' · veri yok'));
    scores.append(box);
  });
  chart.append(scores);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 890 226');svg.setAttribute('class','chart');
  svg.setAttribute('role','img');svg.setAttribute('aria-label',label+' yıllık değişimi. Sayısal değerler alttaki tabloda.');
  const make=(tag,attrs,value)=>{const n=document.createElementNS(svg.namespaceURI,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(value!==undefined)n.textContent=value;svg.append(n);};
  const years=points.map(p=>p[0]), vals=points.map(p=>p[1]);
  const first=Math.min(...years),end=Math.max(...years),lo=Math.min(...vals),hi=Math.max(...vals);
  const x=y=>72+(y-first)*790/Math.max(end-first,1), y=v=>178-(v-lo)*148/(hi-lo||1);
  for(let i=0;i<=3;i++){const v=lo+(hi-lo)*i/3;make('line',{x1:72,x2:862,y1:y(v),y2:y(v),stroke:'#dcddd2'});make('text',{x:65,y:y(v)+4,'text-anchor':'end',fill:'#5b6059','font-size':12},Intl.NumberFormat('tr',{notation:'compact'}).format(v));if(hi===lo)break;}
  [...new Set([first,Math.round((first+end)/2),end])].forEach(t=>make('text',{x:x(t),y:207,'text-anchor':'middle',fill:'#5b6059','font-size':13},t));
  sets.forEach((set,i)=>{let path='';set.forEach(([yr,v],j)=>{path+=(j&&yr===set[j-1][0]+1?' L':' M')+x(yr)+' '+y(v); make('circle',{cx:x(yr),cy:y(v),r:set.length<12?3:1.7,fill:colors[i]});});make('path',{d:path,stroke:colors[i],'stroke-width':2.3,fill:'none'});});
  chart.append(svg);
  const table=node('table'),head=table.createTHead().insertRow();['Yıl',...ids.map(country)].forEach(t=>head.append(node('th',t)));
  const body=table.createTBody();
  [...new Set(years)].sort((a,b)=>b-a).forEach(yr=>{const row=body.insertRow();row.insertCell().textContent=yr;ids.forEach(id=>row.insertCell().textContent=data[id]?.[yr]!=null?fmt(data[id][yr]):'—');});
  el('rows').append(link('Dünya Bankası · '+code+' ↗','https://data.worldbank.org/indicator/'+code),node('p',index.attribution[code],'note'),table);
}
function listArchive() {
  const out=el('archive');out.replaceChildren();
  const key=el('search').value.toLocaleLowerCase('tr');
  const matches=catalog.filter(s=>(s.name+' '+s.provider).toLocaleLowerCase('tr').includes(key));
  if(!matches.length)out.append(node('p','Bu aramayla eşleşen kaynak bulunamadı.'));
  for(const s of matches){
    const card=node('article'), d=node('details');
    d.append(node('summary',s.name+' · '+s.provider));
    if(s.rows)d.append(node('p',fmt(s.rows)+' veri satırı'+(s.indicators?' · '+fmt(s.indicators)+' gösterge':'')));
    const choice=node('select');choice.setAttribute('aria-label',s.name+' arşiv dosyası');
    s.files.forEach(f=>choice.add(option(f,f)));
    const download=link('Dosyayı indir ↓','data/archive/'+choice.value); download.download=choice.value;
    choice.onchange=()=>{download.href='data/archive/'+choice.value;download.download=choice.value;};
    d.append(choice,download,node('p'));d.append(link('Kaynak ve yöntem ↗',s.about));
    card.append(d);out.append(card);
  }
}
const stages=[
  ['7 yaş','Okuldan sonra bir saatin var.','Bir arkadaşınla oku','Mahallende oyun oyna','Birlikte okuduğun arkadaşınla kitap değişmeye başladın.','Mahallede düzenli buluştuğun bir arkadaş grubu oluştu.'],
  ['17 yaş','Hafta sonu için iki teklif aldın.','Atölyeye katıl','Bir işte çalış','Atölyede ilk tasarımını tamamladın.','İlk kazancının bir bölümünü yol masrafın için ayırdın.'],
  ['22 yaş','Başka bir şehirde altı haftalık staj buldun.','Staja git','Yaşadığın yerde devam et','Yeni bir şehirde işe gidip gelmenin ve ev paylaşmanın nasıl olduğunu öğrendin.','Yakın çevrende çalışarak bir sonraki adımına hazırlandın.']
];
const saveKey='ihtimal-life-v1';
let game=null;
try{const saved=JSON.parse(localStorage.getItem(saveKey));if(saved&&['TUR','JPN','NGA'].includes(saved.id)&&Array.isArray(saved.choices)&&saved.choices.length<=3&&saved.choices.every(x=>x===0||x===1))game=saved;}catch{}
function drawGame(){
  const root=el('game');root.replaceChildren();
  const button=(label,fn)=>{const b=node('button',label);b.onclick=fn;root.append(b);return b;};
  const persist=()=>{try{localStorage.setItem(saveKey,JSON.stringify(game));}catch{}drawGame();};
  const start=()=>{const entries=Object.entries(births);let t=Math.random()*entries.reduce((sum,p)=>sum+p[1],0);let id=entries.at(-1)[0];for(const [k,n] of entries){if((t-=n)<0){id=k;break;}}game={id,choices:[]};persist();};
  if(!game){root.append(node('h3','Nerede doğardın?'),node('p','Türkiye, Japonya ve Nijerya arasında 2023 doğum sayılarına göre bir yer seçilir. Ardından üç karar verirsin.'));button('Bir hayata başla →',start).className='play';return;}
  const step=game.choices.length;
  root.append(node('small',country(game.id)+' · '+(step===3?'25 yaş':stages[step][0])));
  if(step){const prev=stages[step-1];root.append(node('p',prev[4+game.choices[step-1]]));}
  if(step===3){root.append(node('h3','İlk 25 yılın'),node('p',game.choices.map((c,i)=>stages[i][2+c]).join(' → ')));button('Başka bir hayat yaşa',start);}
  else {const s=stages[step];root.append(node('h3',s[1]));[0,1].forEach(i=>button(s[2+i],()=>{game.choices.push(i);persist();}));}
  root.append(node('p','Doğum çekilişi BM WPP 2024 verisine dayanır. Üç karar ve sonuçları bu prototip için yazılmış kurgudur.','note'));
}
async function init(){
  [index,catalog,births]=await Promise.all([json('data/index.json'),json('data/catalog.json'),json('births.json')]);
  const entries=Object.keys(index.countries).sort((x,y)=>country(x).localeCompare(country(y),'tr'));
  for(const id of ['a','b'])entries.forEach(code=>el(id).add(option(code,country(code))));
  const populateMetrics=()=>{
    const previous=el('metric').value, term=el('metricSearch').value.trim().toLocaleLowerCase('tr');
    el('metric').replaceChildren();
    Object.entries(index.metrics).filter(([code,m])=>(code+' '+m.join(' ')).toLocaleLowerCase('tr').includes(term)).forEach(([code,m])=>el('metric').add(option(code,m[0])));
    if([...el('metric').options].some(o=>o.value===previous))el('metric').value=previous;
    if(!el('metric').value){++plotVersion;el('chart').textContent='Eşleşen gösterge bulunamadı.';el('rows').replaceChildren();}else plot();
  };
  el('metricSearch').oninput=populateMetrics;populateMetrics();
  el('a').value='TUR';el('b').value='JPN';el('metric').value='SP.DYN.LE00.IN';
  for(const id of ['a','b','metric'])el(id).onchange=plot;
  el('coverage').textContent=fmt(catalog[0].observations)+' WDI gözlemi · '+entries.length+' ülke ve ekonomi · Derleme '+index.date.split('-').reverse().join('.');
  el('search').oninput=listArchive;listArchive();drawGame();
  const regional=[
    ['Türkiye · İllere göre canlı doğumlar','Eurostat, NUTS 3 · Mevcut yıllık kayıtlar.','turkiye-dogumlar.csv','https://ec.europa.eu/eurostat/databrowser/view/demo_r_births/default/table'],
    ['Nijerya · Eyaletlere göre eğitim','NBS / UNICEF, 2021 MICS · Üç eğitim kademesinde tamamlama oranları. Borno verisi yedi yerel yönetim alanını kapsar.','nijerya-egitim-2021.csv','https://www.unicef.org/nigeria/media/6126/file/2021%20MICS%20Statistical%20Snapshots%20Report.pdf'],
    ['Japonya · Prefektörlüklere göre nüfus','Statistics Bureau of Japan, Statistical Handbook 2026, Ek 1 · 2024 nüfusu, alan ve yoğunluk.','japonya-prefektorluk-2024.csv','https://www.stat.go.jp/english/data/handbook/pdf/2026all.pdf#page=212']
  ];
  for(const [title,desc,file,source] of regional){
    const card=node('article'),d=node('details');d.append(node('summary',title),node('p',desc),link('CSV indir ↓','bolgeler/'+file),document.createTextNode(' · '),link('Kaynak ↗',source));card.append(d);el('regional').append(card);
  }
  await plot();
}
init().catch(()=>el('chart').textContent='Veri arşivine erişilemedi. Sayfayı yenileyin.');
