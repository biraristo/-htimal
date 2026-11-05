'use strict';
const host=document.querySelector('#screen');
const saveKey='ihtimal.omur.1';
const names=new Intl.DisplayNames(['tr'],{type:'region'});
const values={skill:'Beceri',ties:'Bağlar',reserve:'Birikim'};
const chapter=age=>age<6?'İlk yıllar':age<13?'Çocukluk':age<20?'Gençlik':age<36?'Kendi yolun':age<60?'Yetişkinlik':'İleri yaşlar';
let world, life, book=[], ticking=false, timer=null, speed=1, storageOK=true;
function read(){try{return JSON.parse(localStorage.getItem(saveKey)||'{}');}catch{return {};}}
function store(){try{localStorage.setItem(saveKey,JSON.stringify({life,book,speed}));}catch{storageOK=false;}}
function esc(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function place(id){const c=world[id];return c.iso2&&/^[A-Z]{2}$/.test(c.iso2)?names.of(c.iso2):c.name;}
function birthPlace(){
 const countries=Object.entries(world);let r=Math.random()*countries.reduce((sum,[,c])=>sum+c.births,0);
 for(const [id,c] of countries)if((r-=c.births)<0)return id;
 return countries.at(-1)[0];
}
function lifespan(table){
 for(const [age,span,q,expectation] of table){
   if(span<0)return age+Math.floor(-Math.log(1-Math.random())*expectation);
   const annual=1-Math.pow(1-q,1/span);
   for(let year=0;year<span;year++)if(Math.random()<annual)return age+year;
 }
 return table.at(-1)[0];
}
function newborn(){
 const id=birthPlace(), c=world[id], sex=Math.random()<c.srb/(100+c.srb)?'1':'2';
 return {id,sex,end:lifespan(c.life[sex]),percentile:c.welfare?1+Math.floor(Math.random()*100):null};
}
function stop(){ticking=false;clearInterval(timer);timer=null;}
function begin(){
 stop();const baby=newborn();
 life={...baby,phase:'birth',age:0,stats:{skill:20,ties:35,reserve:baby.percentile?Math.round(15+baby.percentile*.5):40},tags:[],log:[],done:[],peers:[newborn(),newborn()],last:'',birthYear:2023};
 const loc=world[life.id];
 if(loc.provinces&&Object.keys(loc.provinces).length){let n=Math.random()*Object.values(loc.provinces).reduce((a,b)=>a+b,0);for(const [province,weight] of Object.entries(loc.provinces))if((n-=weight)<0){life.province=province;break;}}
 life.connected=loc.internet?Math.random()*100<loc.internet[1]:null;
 record('Dünyaya geldin.' );store();render();
}
function record(line){life.log.push({age:life.age,line});}
function has(tag){return life.tags.includes(tag);}
const A=(label,hint,text,tag,effects)=>({label,hint,text,tag,effects});
function scene(age){
 const modest=life.percentile!==null&&life.percentile<=35;
 switch(age){
 case 6:return ['Okulun ilk haftası','Teneffüs zili çalıyor. Koridorda tanıdığın kimse yok. Bahçeden top sesleri geliyor; açık bir kapının ardında resimli kitaplar var.',[
 A('Bahçedeki oyuna katıl','Yeni bir arkadaşlık','Oyunun kurallarını sana anlatan çocukla her teneffüs buluşmaya başladın.','friend',{ties:12}),
 A('Kitaplığı keşfet','Sessiz bir merak','Görevli, bitirdiğinde bir yenisini seçmen için sana ilk kitabını verdi.','reader',{skill:12})]];
 case 12:return ['Bir cumartesi sabahı',has('friend')?'İlkokuldan arkadaşın seni birlikte bir şeyler yapmaya çağırdı. Bir yandan da evde onarılmayı bekleyen bir radyo var.':'Kitapta gördüğün bir devre çizimi aklında kaldı. Evdeki eski radyo masada duruyor. Dışarıda yaşıtların bir takım kuruyor.',[
 A('Radyonun içini aç','El becerisi','Radyodan ilk kez ses geldiğinde tamir etmeyi sevdiğini fark ettin.','repair',{skill:14}),
 A('Takımla tanış','Birlikte çalışma','Takımın antrenmanlarını düzenlemeye başladın. Artık biri eksikse seni arıyorlar.','team',{ties:14})]];
 case 17:return ['Okuldan sonraki saatler',modest?'Evde para bu ay erken bitti. Yakındaki dükkân hafta sonu için bir yardımcı arıyor. Aynı gün ücretsiz bir kurs başlıyor.':'Bir cumartesi kursunun ilanını gördün. Aynı günlerde bir dükkânda ücretli çalışman da mümkün. İkisine birden vaktin yetmiyor.',[
 A('Kursa yazıl','Becerilerine zaman ayır',has('repair')?'Tamir merakını kursta ilerlettin. Kendi yaptığın küçük bir cihazı ilk kez birine gösterdin.':'Kursta ilk projeni bitirdin. Eğitmenin çalışmanı ilerideki başvurular için saklamanı önerdi.','study',{skill:18,reserve:-6}),
 A('Dükkânda çalış','İlk düzenli kazanç','Kendi kazancınla ilk kez evdeki bir masrafı üstlendin. Dükkân sahibi ileride sana referans olmayı teklif etti.','work',{reserve:17,skill:4})]];
 case 22:return ['Başka bir şehrin anahtarı',has('study')?'Kurstan tanıdığın eğitmen başka şehirde bir staj önerdi. İlk aylarda yol ve oda masrafı sana ait.':'İş yerindeki referansın sayesinde başka şehirde bir görüşmeye çağrıldın. Gitmek, kurduğun düzeni geride bırakmak demek.',[
 A(life.stats.reserve<34?'Oda paylaşarak taşın':'Yeni şehre taşın','Yeni bir çevre, taşınma masrafı','Bir bavulla yola çıktın. İlk iş gününden sonra yeni adresine tek başına döndün.','moved',{skill:12,reserve:-10,ties:-4}),
 A('Yaşadığın yerde kal','Yakın çevrenle bir düzen kur',has('team')?'Eski takımından birinin haberiyle yakınlarda işe girdin.':'Yakınlarında bir iş buldun. Ailenle aynı sofraya daha sık oturabiliyorsun.','stayed',{ties:14,reserve:6})]];
 case 30:return ['Birine yer açmak',has('moved')?'Yeni şehrindeki bir komşu ortak bir sofra kurmayı önerdi. O akşam işte fazladan mesai var.':'Bir arkadaşın mahallede birlikte yemek hazırlanan bir gün düzenliyor. O akşam ek iş de alabilirsin.',[
 A('Sofrayı birlikte kur','İlişkiler','Sofra zamanla bir buluşma yerine dönüştü. Zor bir haftada kapını çalanlar oldu.','table',{ties:17}),
 A('Ek işi üstlen','Maddi güvence','Ek işten gelen parayı beklenmedik masraflar için ayırdın.','buffer',{reserve:16})]];
 case 42:return ['Yılların birikimi',has('repair')?'Yıllar önce açtığın ilk radyoyu hatırlıyorsun. Bugün kendi atölyeni kurma ihtimali var.':'Bir süredir kendi işini kurmayı düşünüyorsun. Deneyimini bir başkasına öğretme fırsatı da çıktı.',[
 A('Küçük bir iş kur','Bir miktar birikim kullan','İlk müşterinin siparişini kendi adınla teslim ettin.','business',{reserve:-12,skill:15}),
 A('Bir gence yol göster','Deneyimini aktar','Yetiştirdiğin genç ilk işini aldığında sana haber verdi.','mentor',{ties:14,skill:5})]];
 case 56:return ['Zamanını kime ayıracaksın?',has('table')?'Eski sofranızdan bir dostun desteğe ihtiyaç duyuyor. Haftalık düzenini değiştirebilirsin.':'Uzun zamandır görmediğin biri senden yardım istedi. İş yükünü azaltmak için bir karar vermen gerekiyor.',[
 A('Haftada bir gününü ayır','Yakın bağlar','Haftalık ziyaretleriniz ikinizin de beklediği bir alışkanlık oldu.','care',{ties:16,reserve:-5}),
 A('Bir destek grubu kur','Sorumluluğu paylaş','Birlikte yaptığınız küçük takvim sayesinde yardım tek bir kişinin omuzlarında kalmadı.','organize',{skill:8,ties:9})]];
 case 68:return ['Kendine kalan zaman','Çalışma tempon yavaşladı. Sabahları sana ait. Uzun zamandır ertelediğin iki şeyden birine başlayabilirsin.',[
 A('Hatıralarını yaz','Bir yaşam kaydı','Bir defterin ilk sayfasına çocukken hiç unutmadığın bir günü yazdın.','write',{skill:8,ties:5}),
 A('Eski bir dostu ara','Bir bağı yenile','Uzun bir sessizliğin ardından ikiniz de aynı anıya güldünüz.','reconnect',{ties:15})]];
 case 80:return ['Senden kalacak bir şey',has('mentor')?'Yıllar önce yol gösterdiğin kişi seni ziyarete geldi. Bu kez senden bir hatıra istiyor.':'Genç bir yakınınız eskiden günlerin nasıl geçtiğini sordu. Ona bir şey bırakmak istiyorsun.',[
 A('Bir beceri öğret','Bilgini paylaş','Birlikte çalışırken küçücük bir hareketin nasıl kuşaktan kuşağa geçtiğini gördün.','legacy',{skill:5,ties:8}),
 A('Bir mektup bırak','Sözlerini sakla','Zarfın üzerine bir tarih yazdın. Açılacağı günü hayal ettin.','letter',{ties:10})]];
 default:return null;
 }
}
const moments=[6,12,17,22,30,42,56,68,80];
function due(){return moments.includes(life.age)&&!life.done.includes(life.age);}
function finish(){
 stop();life.phase='end';record(life.age===0?'Hayatın ilk yılın dolmadan sona erdi.':'Bu yaşta hayatın sona erdi.');
 book=[{id:life.id,age:life.age,log:life.log.slice(),sex:life.sex},...book].slice(0,15);
}
function passingYear(){
 const events={
  2:'Evdekiler ilk sözcüklerini nasıl söylediğini birbirlerine taklit ediyor.',
  4:'Her sabah aynı köşede durup dışarıdaki sesleri dinliyorsun.',
  9:has('reader')?'Kitaplıktan ödünç aldığın ilk uzun hikâyeyi kendi başına bitirdin.':'Bahçedeki arkadaşını ilk kez evinize davet ettin.',
  14:has('repair')?'Bir komşunun bozulan lambasını onardın. Eline ilk küçük teşekkür hediyen geçti.':'Antrenmana yeni gelen bir çocuğa takımı sen tanıttın.',
  19:has('study')?(life.connected===false?'Kurs başvurusunu gönderebilmek için paylaşımlı bir bilgisayara gittin.':'Kurstan bir arkadaşınla başvuru dosyanı hazırladın.'):'İlk ücretini hangi masraflara ayıracağını kendi başına hesapladın.',
  25:has('moved')?'Eski evindeki eşyalarından birini yeni evine taşıdın. Artık burası da sana ait.':'Mahallende yeni açılan bir yerin ilk çalışanlarından biri senin tanıdığın çıktı.',
  35:has('table')?'Sofranıza bu yıl yeni biri katıldı. Birlikte yemek yapmak günün en sakin saati oldu.':'Ayırdığın para beklenmedik bir ev giderini karşıladı.',
  48:has('business')?'İşinde zor bir dönem geçirdin. İlk müşterilerinden biri seni başkasına önerdi.':'Yol gösterdiğin gencin bir başkasına yardım ettiğini gördün.',
  62:has('care')?'Haftalık ziyaretlerinin birinde uzun zamandır aradığın bir fotoğraf ortaya çıktı.':'Kurulmasına yardım ettiğin destek grubu artık sensiz de buluşuyor.',
  74:has('write')?'Defterini ilk kez başkasına okudun. En çok küçük ayrıntıları dinlemek istediler.':'Eski dostunla konuşmak haftalık bir alışkanlık oldu.',
  88:has('letter')?'Yazdığın mektubun bir kopyasını hayat defterine koydun.':'Öğrettiğin işi senden daha hızlı yapan biri var artık.',
  96:'Doğum gününde eski ve yeni hatıralar aynı sofrada buluştu.'
 };
 const line=events[life.age];if(line){record(line);life.last=line;}
}
function nextAge(){
 if(life.phase!=='run'||due())return;
 if(life.end<=life.age+1){life.age=life.end;finish();}
 else{life.age++;passingYear();if(due())stop();}
}
function advance(jump=false){
 if(!life||life.phase!=='run'||due())return;
 nextAge();
 if(jump)while(life.phase==='run'&&!due())nextAge();
 store();render();
}
function choose(i){
 if(!life||life.phase!=='run'||!due())return;
 const a=scene(life.age)[2][i];
 Object.entries(a.effects).forEach(([key,n])=>life.stats[key]=Math.max(0,Math.min(100,life.stats[key]+n)));
 life.tags.push(a.tag);life.done.push(life.age);life.last=a.text;record(a.text);store();render();
}
function toggle(){
 if(ticking)stop();else if(life.phase==='run'&&!due()){ticking=true;timer=setInterval(()=>advance(),2200/speed);}
 render();
}
function bounds(){
 if(!life.percentile)return 'Bu ülke için karşılaştırılabilir hane dağılımı yok.';
 const p=world[life.id].welfare, low=life.percentile<=35,high=life.percentile>75;
 return (low?'Ailenin imkânları ülke içindeki alt dilimlerde.':high?'Ailenin maddi imkânları ülke içindeki üst dilimlerde.':'Ailenin maddi imkânları ülke içindeki orta dilimlerde.')+' '+p.year+' anketinin '+(p.type==='income'?'gelir':'tüketim')+' dağılımında '+life.percentile+'. yüzdelik dilim.';
}
function logView(log){return '<ol class="log">'+log.slice().reverse().map(x=>'<li><b>'+x.age+' yaş</b><span>'+esc(x.line)+'</span></li>').join('')+'</ol>';}
function sides(){
 const state=Object.entries(values).map(([k,v])=>'<div class="stat"><span>'+v+'</span><span class="meter"><i style="width:'+life.stats[k]+'%"></i></span><b>'+life.stats[k]+'</b></div>').join('');
 const peers=life.peers.map((p,i)=>'<p><b>'+esc(place(p.id))+'</b><br><small>'+(life.age>=p.end?p.end+' yaşında hayatı sona erdi.':life.age+' yaş · seninle aynı kuşak')+'</small></p>').join('');
 return '<aside><section class="card"><p class="over">Bu hayattaki durumun</p>'+state+'<small>Seçimlerinle değişen oyun puanları.</small></section><section class="card"><h3>Aynı yıl doğanlar</h3>'+peers+'</section></aside>';
}
function action(id,text,cls='start'){return '<button id="'+id+'" class="'+cls+'">'+text+'</button>';}
function render(){
 if(!life){host.innerHTML='<section class="hero"><div><p class="over">Bir yaşam simülasyonu</p><h1>Ya yeniden<br><em>doğsaydın?</em></h1><p class="lead">Bir aileye, bir yere ve bir zamana doğacaksın. Nerede başlayacağını şans, nasıl yaşayacağını biraz da sen belirleyeceksin.</p>'+action('begin','Dünyaya gel ↗')+'<p class="fine">'+Object.keys(world).length+' ülke ve bölge · Hesapsız oynanır</p></div><img src="globe.svg" alt=""></section>';document.getElementById('begin').onclick=begin;return;}
 const land=esc(life.province?life.province+' · '+place(life.id):place(life.id)),girl=life.sex==='2';
 let main='';
 if(life.phase==='birth'){
 main='<div class="seal" aria-hidden="true">◒</div><p class="over">Doğum kaydı · 2023</p><h2>İlk nefesin.</h2><p>Doğduğun yer <b>'+land+'</b>. Hayatının ilk sayfası açıldı.</p><div class="birth"><div><strong>Doğum yeri</strong>'+land+'</div><div><strong>Doğum yılı</strong>2023</div><div><strong>Doğum kaydı</strong>'+(girl?'Kız':'Erkek')+' bebek</div></div><p>'+esc(bounds())+'</p>'+action('go','Bu hayatı yaşa →');
 }else if(life.phase==='end'){
 main='<p class="over">Ömrünün son sayfası</p><h2>'+life.age+' yıllık bir hayat.</h2><p>'+land+' ile başlayan hayat hikâyen burada tamamlandı.</p><p>'+life.done.length+' karar verdin. '+(life.done.length?'Defterinde seçimlerinin izleri kaldı.':'Karar verecek yaşa ulaşamadın.')+'</p>'+action('again','Yeni bir hayata doğ ↗');
 }else if(due()){
 const [title,desc,choices]=scene(life.age);
 main='<p class="over">'+life.age+' yaş · Bir karar anı</p><h2>'+esc(title)+'</h2><p>'+esc(desc)+'</p><div class="options">'+choices.map((a,i)=>'<button data-choice="'+i+'">'+esc(a.label)+'<small>'+esc(a.hint)+'</small></button>').join('')+'</div>';
 }else{
 main='<p class="over">'+esc(chapter(life.age))+'</p><h2>'+life.age+' yaşındasın.</h2><p class="outcome">'+esc(life.last||'Seni büyüten insanların yüzlerini ve seslerini tanımaya başlıyorsun.')+'</p>'+action('jump','Sonraki dönüm noktasına geç →')+'<div class="controls">'+action('year','Bir yıl ilerle','alt')+action('timer',ticking?'Duraklat':'Otomatik ilerlet','alt')+'<select id="speed" aria-label="Yılların geçiş hızı">'+[1,2,4].map(s=>'<option value="'+s+'" '+(speed===s?'selected':'')+'>'+s+'× hız</option>').join('')+'</select></div>';
 }
 host.innerHTML='<section class="play"><div class="headrow"><div><p class="over">Hayat defteri</p><h3>'+land+' · '+(life.birthYear+life.age)+'</h3></div><strong class="bigage">'+life.age+' yaş</strong></div><div class="agebar"><i style="width:'+Math.min(life.age,100)+'%"></i></div><div class="grid"><section class="paper">'+main+'</section>'+sides()+'</div><section class="card" style="margin-top:18px"><h3>Yaşam çizgin</h3>'+logView(life.log)+'</section>'+(!storageOK?'<p>Kayıt için tarayıcı depolaması kullanılamıyor.</p>':'')+'</section>';
 const bind=(id,fn)=>{const b=document.getElementById(id);if(b)b.onclick=fn;};
 bind('go',()=>{life.phase='run';if(life.end===0)finish();store();render();});bind('again',begin);bind('jump',()=>advance(true));bind('year',()=>advance());bind('timer',toggle);
 host.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>choose(Number(b.dataset.choice)));
 const sel=document.getElementById('speed');if(sel)sel.onchange=()=>{speed=Number(sel.value);if(ticking){stop();toggle();}store();};
}
document.getElementById('mem').onclick=()=>{if(!world)return;stop();render();document.getElementById('entries').innerHTML=(life&&life.phase!=='end'?'<p>Süren hayatın: '+esc(place(life.id))+' · '+life.age+' yaş.</p>':'')+(book.length?book.map(x=>'<details class="history"><summary>'+esc(place(x.id))+' · '+x.age+' yıl</summary>'+logView(x.log)+'</details>').join(''):'<p>Bir hayatı tamamladığında hikâyesini burada yeniden okuyabilirsin.</p>');document.getElementById('journal').showModal();};
document.getElementById('close').onclick=()=>document.getElementById('journal').close();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&ticking){stop();render();}});
fetch('world.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{world=d;const saved=read();if(saved.life&&world[saved.life.id]&&['birth','run','end'].includes(saved.life.phase)&&Array.isArray(saved.life.done)&&Array.isArray(saved.life.log))life=saved.life;book=Array.isArray(saved.book)?saved.book.filter(x=>world[x.id]&&Array.isArray(x.log)):[];speed=[1,2,4].includes(saved.speed)?saved.speed:1;render();}).catch(()=>{host.innerHTML='<section class="play"><h2>Dünya yüklenemedi.</h2><p>Bağlantını kontrol edip sayfayı yenile.</p></section>';});
