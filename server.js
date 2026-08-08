const path = require("path");
const crypto = require("crypto");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const socketOptions={pingInterval:20000,pingTimeout:20000,maxHttpBufferSize:1e5,connectionStateRecovery:{maxDisconnectionDuration:120000,skipMiddlewares:true}};
if(process.env.APP_ORIGIN)socketOptions.cors={origin:process.env.APP_ORIGIN.split(",").map((origin)=>origin.trim()),methods:["GET","POST"]};
const io = new Server(server,socketOptions);
app.set("trust proxy",1);
app.disable("x-powered-by");
app.use(express.static(path.join(__dirname,"public"),{setHeaders:(response,file)=>{if(file.includes(`${path.sep}assets${path.sep}`))response.setHeader("Cache-Control","public, max-age=86400");}}));
app.get("/health", (_req, res) => res.json({ ok:true, game:"campus-head-ball", engine:"5.7.0" }));

const PORT = process.env.PORT || 3001;
const FPS = 60;
const DT = 1 / FPS;
const GROUND = 610;
const CEILING = 48;
const GOAL_TOP = 350;
const WIDE_GOAL_TOP = 325;
// 2v2'de iki oyuncunun aynı koridorda üst üste binmemesi için saha %25 uzatıldı.
const WORLD_WIDTH = 1720;
const CENTER = WORLD_WIDTH / 2;
const LEFT_LINE = 92;
const RIGHT_LINE = WORLD_WIDTH - 92;
const PLAYER_LEFT = 185;
const PLAYER_RIGHT = WORLD_WIDTH - 185;
const SLOT_COUNT = 4;
const STAGE_COUNT = 18;
const teamOf = (slot) => slot < 2 ? 0 : 1;
const ARENA_WIDTHS = {compact:1376,wide:1720};
const activeSlots = (room) => room.format === "1v1" ? [0,2] : [0,1,2,3];
const goalTopFor = (room) => (room?.arenaSize === "wide" ? WIDE_GOAL_TOP : GOAL_TOP) - (room?.format === "1v1" ? 14 : 0);
// Karakterler görsel ve fiziksel olarak yaklaşık %6 kısadır. Sınıfların hız ve
// sıçrama farkları korunur; kalenin üst koridorunda küçük bir şut penceresi açılır.
const HITBOX={headY:-190,headRadius:37,activeHeadRadius:48,torsoY:-129,torsoRadius:43,bodyY:-57,bodyRadius:41};
const CROUCH_HITBOX={headY:-157,headRadius:37,torsoY:-105,torsoRadius:45,bodyY:-46,bodyRadius:43};
const RULE_OPTIONS={durations:[60,90,120,180],goalLimits:[3,5,7,10]};
const AI_DIFFICULTIES=["easy","normal","hard"];
const SPECIAL_KINDS=["curve","burst","quake","rocket","magnet","counter","precision","lodos","curve","burst","lodos","quake","precision","rocket","magnet","counter"];
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const approach = (value,target,amount) => value<target?Math.min(value+amount,target):Math.max(value-amount,target);

const ROSTER = [
  {name:"Alpsu",type:"Dengeli",speed:300,accel:2450,jump:655,air:1,mass:1,power:1,special:"Falso Kafa",desc:"Dengeli. Özel kafası topa sert falso verir.",stories:[
    "Alpsu, kampüs turnuvalarında rakibinden önce boşluğu görmesiyle tanındı. Bu gece oyunu hızla değil, doğru anda yaptığı tek dokunuşla çözmeye geliyor.",
    "Bir final gecesinde son saniye falsosuyla tribünleri ayağa kaldırdı; fakat kupayı direğe çarpan son top yüzünden kaçırdı. Şimdi yarım kalan o hesabı kapatmak istiyor.",
    "Alpsu için her maç çözülmesi gereken yeni bir denklem. Rakibinin ilk hamlesini bekler, ikinciyi tahmin eder ve üçüncüye fırsat bırakmaz."
  ]},
  {name:"İhsan",type:"Sprinter",speed:355,accel:2900,jump:625,air:1.16,mass:.86,power:.92,special:"Çifte Hamle",desc:"En hızlısı. Havada çevik, fakat fiziksel olarak hafif.",stories:[
    "İhsan, antrenmanlara herkesten önce gelip kampüs yokuşlarını sprint pistine çevirdi. Onun planı basit: rakibi daha karar vermeden topa ulaşmak.",
    "Geçen sezonun en hızlı oyuncusuydu ama kritik maçta aceleciliğine yenildi. Bu kez hızını sabırla birleştirip gerçek bir lider olduğunu kanıtlamaya geliyor.",
    "Takım arkadaşları liderliği İhsan'a bırakıyor; çünkü geriye düştüğünde bile oyunun ritmini bırakmıyor. Son saniyeye kadar koşar, son topa ilk o yükselir."
  ]},
  {name:"Eaytaclar",type:"Duvar",speed:255,accel:2050,jump:570,air:.82,mass:1.28,power:1.22,special:"Deprem Kafası",desc:"Yavaş ve ağır. En güçlü kafa vuruşuna sahip.",stories:[
    "Eaytaclar bir adım atana kadar rakibi üç adım atabilir; ama top onun alnına değdiğinde bütün saha bunu duyar. Bugün kaleyi değil, sahanın merkezini sahiplenmeye geliyor.",
    "Kampüsün eski halı saha maçlarında ona Duvar lakabını verdiler. Şimdi yalnızca savunmak değil, Deprem Kafası ile skoru sarsmak istediğini söylüyor.",
    "Eaytaclar hızlı oyuncuları kovalamaz; nereye gideceklerini önceden seçer. Gücünü doğru yerde kullanırsa tek vuruş maçın bütün hikâyesini değiştirebilir."
  ]},
  {name:"Littlerose",type:"Hava Hakimi",speed:315,accel:2500,jump:735,air:1.24,mass:.94,power:.98,special:"Roket Kafa",desc:"En yükseğe sıçrar ve havada topa hükmeder.",stories:[
    "Littlerose ilk kez yüksek bir topa herkesten bir baş yukarıda vurduğunda bütün saha onu konuştu. O günden beri saha çizgilerine değil, gökyüzündeki koridorlara bakıyor.",
    "Bir zamanlar yere basarak oynamaya çalıştı ve kaybetti. Şimdi kendi oyununu kabul etti: yüksel, havada yön değiştir ve topu kimsenin erişemeyeceği açıdan gönder.",
    "Littlerose için tribünlerin sessizleştiği an, topun havada asılı kaldığı andır. O boşlukta zamanı yavaşlatır ve maçın kaderine yukarıdan dokunur."
  ]},
  {name:"Jibiji",type:"Oyun Kurucu",speed:325,accel:2700,jump:640,air:1.13,mass:.90,power:.90,special:"Mıknatıs Kafa",desc:"Topu kafa koridoruna çeker; ham gücü yerine zamanlamayla oynar.",stories:[
    "Jibiji, Henry Ford çimlerinde dar alandan çıkardığı paslarla ün kazandı. Bugün topu kendi kafa koridoruna çekip rakibin dengesini tek dokunuşta bozmak istiyor.",
    "Herkes onun topun peşinden koştuğunu sanır; oysa Jibiji topun nereye geleceğini çoktan seçmiştir. Mıknatıs Kafa, sabırlı oyun kurucunun en büyük kozu.",
    "Geçen kampüs kupasında güce karşı güç denedi ve elendi. Bu sezon hızını zekâyla birleştirerek oyunun yönünü kendi etrafında bükmeye geliyor."
  ]},
  {name:"UCY",type:"Kontra Uzmanı",speed:285,accel:2250,jump:610,air:.94,mass:1.12,power:1.08,special:"Ayna Kafa",desc:"Hızlı gelen topu daha sert geri yollar; yavaş toplarda etkisi sınırlıdır.",stories:[
    "UCY, rakibin en sert vuruşunu bekleyip aynı hızla geri göndermesiyle tanındı. Ona göre iyi savunma, hücumun yalnızca ters yöne çevrilmiş hâlidir.",
    "Bir finalde erken saldırıp bütün enerjisini tüketti. Şimdi acele etmiyor; rakibin hızını ödünç alıp Ayna Kafa ile doğru anda karşılık veriyor.",
    "Kampüsün taş merdivenlerinde yaptığı dayanıklılık idmanları onu kolay yıkılmayan bir kontra ustasına dönüştürdü. Gücü, rakibinin cesareti arttıkça büyüyor."
  ]},
  {name:"Alto",type:"Taktisyen",speed:305,accel:2500,jump:645,air:1.06,mass:.98,power:.96,special:"Geometri Kafa",desc:"Dengeli taktikçi. Özel kafası topu hesaplı bir açıyla uzak üst köşeye yollar.",stories:[
    "Alto, kampüsün taş merdivenlerinde yıllarca açıları hesapladı. Şimdi tahtası yok; denklemini topun üzerine yazıp uzak üst köşeyi hedefliyor.",
    "Rakipler gözlüğüne bakıp onun sakin olduğunu sanıyor. Oysa Alto her sekmeyi üç hamle önceden görür ve boşluğu daha oluşmadan seçer.",
    "Bir final maçında herkes güce oynarken o tek dokunuşla üst köşeyi buldu. Geometri Kafa o gece doğdu; şimdi formülünü kampüs kupasına taşımaya geliyor."
  ]},
  {name:"İdiko",type:"Hava Oyun Kurucu",speed:315,accel:2630,jump:660,air:1.18,mass:.89,power:.89,special:"Lodos Kafa",desc:"Havada çevik ve yaratıcı. Özel kafası topu savunmanın üstünde kısa süre asılı tutar.",stories:[
    "Rumelifeneri'nin sert rüzgârında herkes topun peşinden koşarken İdiko onun nereye süzüleceğini öğrendi. Şimdi havadaki boşlukları pas koridoruna çevirmeye geliyor.",
    "İdiko bir kampüs finalinde en güçlü vuruşu denedi ve topu tribüne gönderdi. O günden beri kuvvet yerine ritmi seçiyor; topu yükseltip doğru anda düşürüyor.",
    "Rakipleri onun sakinliğini tereddüt sanıyor. Oysa İdiko top havaya çıktığında oyunun hızını değiştirir, savunmayı bekletir ve ikinci hamleyi takımına bırakır."
  ]},
  {name:"Teker",type:"Sekmeci",speed:305,accel:2520,jump:650,air:1.02,mass:1.03,power:1.02,special:"Çark Kafa",desc:"Dengeli ve kıvrak. Özel kafası topa keskin bir dönüş kazandırır.",stories:[
    "Teker, kampüs koridorlarında her sekmeyi yeni bir açıya çevirerek çalıştı. Şimdi Çark Kafa ile savunmanın beklemediği köşeyi arıyor.",
    "Dama desenli forması kadar oyunu da kolay okunmaz. Bir an merkezde görünür, sonraki anda topu ters yöne büker.",
    "Teker için kötü seken top yoktur; yalnızca henüz yönü seçilmemiş bir fırsat vardır."
  ]},
  {name:"Ysoner",type:"Seri Pasör",speed:340,accel:2800,jump:630,air:1.12,mass:.90,power:.94,special:"Vites Kafa",desc:"Çabuk hızlanır ve boşluğu erken kapatır. Fiziksel mücadelede hafiftir.",stories:[
    "Ysoner ilk adımını rakip düşünmeden atar. Vites Kafa başladığında saha bir anda ona küçük gelir.",
    "Onun oyunu uzun hazırlıklara değil, doğru anda yapılan kısa ve keskin hızlanmalara dayanır.",
    "Ysoner topu kovalamaz; topun birazdan geleceği boşluğa herkesten önce gider."
  ]},
  {name:"Ulushain",type:"Dalga Ustası",speed:310,accel:2500,jump:700,air:1.20,mass:.92,power:.96,special:"Dalga Kafa",desc:"Yüksek toplarda çevik. Özel kafası topu havada kısa süre yüzdürür.",stories:[
    "Ulushain'in uzun bukleleri yükseldiğinde tribünler hava topunun ona ait olduğunu bilir.",
    "Dalga Kafa topu aceleyle kaleye göndermez; önce savunmayı bekletir, sonra boşluğa bırakır.",
    "Ulushain oyunun ritmini yerden değil havadan kurar ve ikinci hamleyi herkesten önce görür."
  ]},
  {name:"Kaynımol",type:"Bariyer",speed:265,accel:2100,jump:585,air:.85,mass:1.25,power:1.18,special:"Bariyer Kafa",desc:"Ağır ve sağlam. Yakındaki topu güçlü bir darbeyle tehlikeden uzaklaştırır.",stories:[
    "Kaynımol çizgili gözlüğünün ardından oyunu sakin izler; top yaklaştığında bütün koridoru tek darbede kapatır.",
    "Sarı-siyah zikzaklar rakip için bir uyarıdır: Bariyer Kafa'nın etki alanına giren top kolay dönmez.",
    "Kaynımol hızlı görünmez, fakat doğru yerde durduğunda rakibin bütün hızını anlamsız bırakır."
  ]},
  {name:"Irene",type:"Keskin Nişancı",speed:300,accel:2450,jump:640,air:1,mass:1,power:.98,special:"İğne Kafa",desc:"Dengeli nişancı. Özel kafası uzak üst köşeye hesaplı bir rota çizer.",stories:[
    "Irene antrenmanda aynı üst köşeyi yüzlerce kez hedefledi. Şimdi tek bir temiz temasın yeterli olduğuna inanıyor.",
    "Rakip gücü beklerken Irene açıyı seçer; İğne Kafa kalabalığın arasından ince bir yol bulur.",
    "Irene için kalenin büyüklüğü değil, savunmanın bıraktığı birkaç santimlik boşluk önemlidir."
  ]},
  {name:"Caner",type:"Akıncı",speed:330,accel:2700,jump:690,air:1.14,mass:.92,power:1,special:"Şimşek Kafa",desc:"Patlayıcı ve çevik. Özel hamlede yükselip topa sert bir açıyla saldırır.",stories:[
    "Caner'in forması gibi oyunu da bir şimşek çizgisi izler: kısa, ani ve doğrudan kaleye.",
    "Top yükseldiğinde Caner beklemez; Şimşek Kafa ile aynı anda hem mesafe hem irtifa kazanır.",
    "Caner'in en tehlikeli anı durduğu an değildir, ilk adımını attığı andır."
  ]},
  {name:"Küçük Durak",type:"Çekim Ustası",speed:320,accel:2650,jump:645,air:1.12,mass:.90,power:.90,special:"Durak Kafa",desc:"Çevik oyun kurucu. Topu kısa süre kendi kafa koridoruna çeker.",stories:[
    "Küçük Durak'ın adı durmayı söyler, oyunu ise sürekli hareket eder. Topu kendine çekip boşluğu bir anda açar.",
    "Dört parçalı forması gibi sahayı da küçük bölgelere ayırır; Durak Kafa topu tam istediği bölgeye çağırır.",
    "Rakip topun yönünü okuduğunu sanırken Küçük Durak oyunun merkezini çoktan değiştirmiş olur."
  ]},
  {name:"Nevşo",type:"Yankı Savunmacı",speed:290,accel:2300,jump:620,air:.96,mass:1.10,power:1.07,special:"Yankı Kafa",desc:"Sağlam kontra oyuncusu. Hızlı gelen topu daha sert biçimde geri yollar.",stories:[
    "Nevşo rakibin en sert şutundan kaçmaz; o hızı Yankı Kafa ile sahibine geri gönderir.",
    "Sakin bekleyişi pasiflik değildir. Nevşo rakibin acele ettiği anı kendi hücumunun başlangıcı yapar.",
    "Nevşo'nun gücü top hızlandıkça büyür; doğru zamanda yaptığı tek karşılık bütün maçı çevirebilir."
  ]}
];
const BALLS = [
  {name:"Hafif Köpük",radius:37,gravity:920,bounce:.91,drag:.9987,mass:.8,max:1320,curve:.00024,color:"#55efff",accent:"#ffffff",desc:"Canlı seker, havada okunur kalır ve kontrolsüz hızlanmaz."}
];
const rooms = new Map();

function makeCode(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let code;do code=Array.from({length:5},()=>chars[Math.floor(Math.random()*chars.length)]).join("");while(rooms.has(code));return code;}
function makeToken(){return crypto.randomBytes(18).toString("base64url");}
function clean(value){return String(value||"Oyuncu").replace(/[<>]/g,"").trim().slice(0,18)||"Oyuncu";}
function clearReady(room){room.ready=Array(SLOT_COUNT).fill(false);}
function openSlot(room){return (room.format==="1v1"?[2,0]:[2,1,3,0]).find((slot)=>!room.controllers[slot]);}
function humanSlots(room){return [...room.members.values()].map((member)=>member.slot);}
function makeRoom(socket,name,options={}){
  const token=makeToken(),member={name:clean(name),slot:0,token};
  const format=options.format||"2v2",arenaSize=options.arenaSize||"wide";
  const room={code:makeCode(),hostId:socket.id,hostToken:token,members:new Map([[socket.id,member]]),sessions:new Map([[token,{...member,lastSeen:Date.now()}]]),controllers:[socket.id,null,null,null],inputs:new Map(),selections:[null,null,null,null],ready:[false,false,false,false],format,arenaSize,worldWidth:ARENA_WIDTHS[arenaSize],playMode:options.playMode||"multiplayer",competition:options.competition||"private",cpuDifficulty:AI_DIFFICULTIES.includes(options.cpuDifficulty)?options.cpuDifficulty:"normal",rules:options.rules||{duration:90,goalLimit:5},ballType:0,stage:Number.isInteger(options.stage)?options.stage:0,phase:"lobby",players:[],ball:null,score:[0,0],timer:90,overtime:false,pause:0,kickoff:0,introRemaining:0,introSkipped:[false,false,false,false],introStories:["","","",""],storyIndices:[0,0,0,0],matchupTitle:"",eventId:0,winner:null,shake:0,emptySince:null,lastKickoffSide:0,kickoffStreak:0};
  rooms.set(room.code,room);return{room,token};
}
function lobby(room){return{code:room.code,hostId:room.hostId,phase:room.phase,format:room.format,arenaSize:room.arenaSize,worldWidth:room.worldWidth,goalTop:goalTopFor(room),playMode:room.playMode,competition:room.competition,cpuDifficulty:room.cpuDifficulty,selections:room.selections,ready:room.ready,rules:room.rules,ballType:room.ballType,stage:room.stage,members:[...room.members.entries()].map(([id,member])=>({id,name:member.name,side:member.slot,slot:member.slot,team:teamOf(member.slot)}))};}
function emitLobby(room){io.to(room.code).emit("lobby",lobby(room));}
function leave(socket,forgetSession=false){
  const code=socket.data.room;if(!code)return;const room=rooms.get(code);socket.leave(code);socket.data.room=null;if(!room)return;
  const member=room.members.get(socket.id);room.members.delete(socket.id);room.inputs.delete(socket.id);if(member){room.controllers[member.slot]=null;const session=room.sessions.get(member.token);if(session)session.lastSeen=Date.now();if(forgetSession)room.sessions.delete(member.token);}
  if(!room.members.size)room.emptySince=Date.now();
  if(room.hostId===socket.id&&room.members.size){const [nextId,nextMember]=room.members.entries().next().value;room.hostId=nextId;room.hostToken=nextMember.token;}
  emitLobby(room);
}

io.on("connection",(socket)=>{
  socket.on("createRoom",({name}={},reply=()=>{})=>{leave(socket,true);const created=makeRoom(socket,name),room=created.room;socket.join(room.code);socket.data.room=room.code;reply({ok:true,room:lobby(room),sessionToken:created.token});emitLobby(room);});
  socket.on("createSolo",({name,competition="quick",rules,character,difficulty="normal"}={},reply=()=>{})=>{
    if(!["quick","season","cup"].includes(competition))return reply({ok:false,error:"Geçersiz tek oyunculu mod."});
    const defaultRules=competition==="cup"?{duration:120,goalLimit:5}:{duration:90,goalLimit:5},savedRules=rules&&RULE_OPTIONS.durations.includes(Number(rules.duration))&&RULE_OPTIONS.goalLimits.includes(Number(rules.goalLimit))?{duration:Number(rules.duration),goalLimit:Number(rules.goalLimit)}:defaultRules;
    const cpuDifficulty=AI_DIFFICULTIES.includes(difficulty)?difficulty:"normal";leave(socket,true);const created=makeRoom(socket,name,{playMode:"single",competition,format:"1v1",arenaSize:"compact",rules:savedRules,cpuDifficulty,stage:Math.floor(Math.random()*STAGE_COUNT)}),room=created.room;if(Number.isInteger(character)&&character>=0&&character<ROSTER.length)room.selections[0]=character;socket.join(room.code);socket.data.room=room.code;reply({ok:true,room:lobby(room),sessionToken:created.token});emitLobby(room);
  });
  socket.on("quickMatch",({name}={},reply=()=>{})=>{
    const waiting=[...rooms.values()].find((candidate)=>candidate.playMode==="multiplayer"&&candidate.competition==="onlineQuick"&&candidate.phase==="lobby"&&candidate.members.size===1);
    if(waiting){const slot=2,token=makeToken(),member={name:clean(name),slot,token};leave(socket,true);waiting.members.set(socket.id,member);waiting.sessions.set(token,{...member,lastSeen:Date.now()});waiting.controllers[slot]=socket.id;waiting.emptySince=null;socket.join(waiting.code);socket.data.room=waiting.code;reply({ok:true,matched:true,room:lobby(waiting),sessionToken:token});emitLobby(waiting);return;}
    leave(socket,true);const created=makeRoom(socket,name,{playMode:"multiplayer",competition:"onlineQuick",format:"1v1",arenaSize:"compact",stage:Math.floor(Math.random()*STAGE_COUNT)}),room=created.room;socket.join(room.code);socket.data.room=room.code;reply({ok:true,waiting:true,room:lobby(room),sessionToken:created.token});emitLobby(room);
  });
  socket.on("joinRoom",({code,name}={},reply=()=>{})=>{
    const room=rooms.get(String(code||"").toUpperCase().replace(/[^A-Z0-9]/g,""));
    if(!room)return reply({ok:false,error:"Saha bulunamadı."});if(room.playMode==="single")return reply({ok:false,error:"Bu tek oyunculu bir kariyer sahası."});if(["intro","playing","goalPause"].includes(room.phase))return reply({ok:false,error:"Maç başladı. Sonraki maç için bekle."});if(room.members.size>=activeSlots(room).length)return reply({ok:false,error:room.format==="1v1"?"Bu 1'e 1 saha dolu.":"Bu saha dört oyuncuyla dolu."});
    const slot=openSlot(room);if(slot===undefined)return reply({ok:false,error:"Boş oyuncu koltuğu bulunamadı."});leave(socket,true);for(const [oldToken,session] of room.sessions)if(session.slot===slot)room.sessions.delete(oldToken);const token=makeToken(),member={name:clean(name),slot,token};room.members.set(socket.id,member);room.sessions.set(token,{...member,lastSeen:Date.now()});room.controllers[slot]=socket.id;room.selections[slot]=null;room.ready[slot]=false;room.emptySince=null;socket.join(room.code);socket.data.room=room.code;reply({ok:true,room:lobby(room),sessionToken:token});emitLobby(room);
  });
  socket.on("leaveRoom",(_payload,reply=()=>{})=>{leave(socket,true);reply({ok:true});});
  socket.on("resumeSession",({code,token}={},reply=()=>{})=>{
    const room=rooms.get(String(code||"").toUpperCase()),session=room?.sessions.get(String(token||""));if(!room||!session)return reply({ok:false,error:"Önceki saha artık açık değil."});
    const activeId=room.controllers[session.slot];if(activeId&&room.members.has(activeId)&&activeId!==socket.id)return reply({ok:false,error:"Bu oyuncu başka bir pencerede bağlı."});
    leave(socket,true);const member={name:session.name,slot:session.slot,token:String(token)};room.members.set(socket.id,member);room.controllers[session.slot]=socket.id;room.inputs.set(socket.id,{});session.lastSeen=Date.now();room.emptySince=null;if(room.hostToken===token)room.hostId=socket.id;socket.join(room.code);socket.data.room=room.code;const current=["intro","playing","goalPause","matchOver"].includes(room.phase)&&room.players.length?publicState(room):null;reply({ok:true,room:lobby(room),state:current,sessionToken:String(token)});emitLobby(room);
  });
  socket.on("chooseSlot",({slot}={},reply=()=>{})=>{const room=rooms.get(socket.data.room),member=room?.members.get(socket.id);slot=Number(slot);if(!room||room.phase!=="lobby"||!member||!activeSlots(room).includes(slot))return reply({ok:false,error:"Bu koltuk seçili maç düzeninde kapalı."});if(room.controllers[slot]&&room.controllers[slot]!==socket.id)return reply({ok:false,error:"Bu koltuk dolu."});const old=member.slot;if(old===slot)return reply({ok:true});for(const [oldToken,session] of room.sessions)if(session.slot===slot&&oldToken!==member.token)room.sessions.delete(oldToken);const character=room.selections[old];room.controllers[old]=null;room.selections[old]=null;room.ready[old]=false;room.controllers[slot]=socket.id;room.selections[slot]=character;room.ready[slot]=false;member.slot=slot;const session=room.sessions.get(member.token);if(session)session.slot=slot;emitLobby(room);reply({ok:true});});
  socket.on("setFormat",({format}={},reply=()=>{})=>{const room=rooms.get(socket.data.room);if(!room||room.phase!=="lobby"||room.hostId!==socket.id||room.competition==="onlineQuick")return reply({ok:false,error:"Bu modda maç düzeni değiştirilemez."});if(!["1v1","2v2"].includes(format))return reply({ok:false,error:"Geçersiz maç düzeni."});if(format==="1v1"&&room.members.size>2)return reply({ok:false,error:"Odada ikiden fazla kişi varken 1'e 1 seçilemez."});if(room.format===format)return reply({ok:true});room.format=format;if(format==="1v1"){const entries=[...room.members.entries()].sort(([a],[b])=>a===room.hostId?-1:b===room.hostId?1:0),saved=entries.map(([id,member])=>({id,member,character:room.selections[member.slot]}));room.controllers=[null,null,null,null];room.selections=[null,null,null,null];saved.forEach((item,index)=>{const slot=index===0?0:2;item.member.slot=slot;room.controllers[slot]=item.id;room.selections[slot]=item.character;const session=room.sessions.get(item.member.token);if(session)session.slot=slot;});}clearReady(room);emitLobby(room);reply({ok:true});});
  socket.on("setArenaSize",({arenaSize}={},reply=()=>{})=>{const room=rooms.get(socket.data.room);if(!room||room.phase!=="lobby"||room.hostId!==socket.id)return reply({ok:false,error:"Saha boyutunu yalnızca saha sahibi değiştirebilir."});if(!ARENA_WIDTHS[arenaSize])return reply({ok:false,error:"Geçersiz saha boyutu."});room.arenaSize=arenaSize;room.worldWidth=ARENA_WIDTHS[arenaSize];clearReady(room);emitLobby(room);reply({ok:true});});
  socket.on("selectCharacter",({index}={},reply=()=>{})=>{const room=rooms.get(socket.data.room),member=room?.members.get(socket.id);index=Number(index);if(!room||room.phase!=="lobby"||!member||!Number.isInteger(index)||index<0||index>=ROSTER.length)return reply({ok:false});if(room.selections.some((selected,slot)=>slot!==member.slot&&selected===index))return reply({ok:false,error:"Bu karakter başka bir oyuncu tarafından seçildi."});room.selections[member.slot]=index;room.ready[member.slot]=false;emitLobby(room);reply({ok:true});});
  socket.on("selectCpuCharacter",({slot,index}={},reply=()=>{})=>{const room=rooms.get(socket.data.room);slot=Number(slot);const parsed=index===null||index===""?null:Number(index);if(!room||room.phase!=="lobby"||room.hostId!==socket.id)return reply({ok:false,error:"CPU karakterlerini yalnızca saha sahibi seçebilir."});if(!activeSlots(room).includes(slot)||room.controllers[slot])return reply({ok:false,error:"Bu koltuk CPU tarafından kullanılmıyor."});if(parsed!==null&&(!Number.isInteger(parsed)||parsed<0||parsed>=ROSTER.length))return reply({ok:false,error:"Geçersiz karakter."});if(parsed!==null&&room.selections.some((selected,otherSlot)=>otherSlot!==slot&&activeSlots(room).includes(otherSlot)&&selected===parsed))return reply({ok:false,error:"Bu karakter başka bir koltukta seçili."});room.selections[slot]=parsed;clearReady(room);emitLobby(room);reply({ok:true});});
  socket.on("selectStage",({index}={})=>{const room=rooms.get(socket.data.room);index=Number(index);if(room&&room.phase==="lobby"&&room.hostId===socket.id&&Number.isInteger(index)&&index>=0&&index<STAGE_COUNT){room.stage=index;clearReady(room);emitLobby(room);}});
  socket.on("setRules",({duration,goalLimit}={},reply=()=>{})=>{const room=rooms.get(socket.data.room);duration=Number(duration);goalLimit=Number(goalLimit);if(!room||room.phase!=="lobby"||room.hostId!==socket.id)return reply({ok:false,error:"Maç kurallarını yalnızca saha sahibi değiştirebilir."});if(!RULE_OPTIONS.durations.includes(duration)||!RULE_OPTIONS.goalLimits.includes(goalLimit))return reply({ok:false,error:"Geçersiz maç kuralı."});room.rules={duration,goalLimit};clearReady(room);emitLobby(room);reply({ok:true});});
  socket.on("setReady",({ready}={},reply=()=>{})=>{const room=rooms.get(socket.data.room),member=room?.members.get(socket.id);if(!room||room.phase!=="lobby"||!member)return reply({ok:false});if(room.selections[member.slot]===null)return reply({ok:false,error:"Önce karakterini seç."});room.ready[member.slot]=!!ready;emitLobby(room);reply({ok:true});});
  socket.on("startMatch",(_payload,reply=()=>{})=>{
    const room=rooms.get(socket.data.room);if(!room||room.hostId!==socket.id)return reply({ok:false,error:"Maçı saha sahibi başlatabilir."});if(room.competition==="onlineQuick"&&room.members.size<2)return reply({ok:false,error:"Hızlı eşleşme için rakip aranıyor."});for(const member of room.members.values()){if(room.selections[member.slot]===null)return reply({ok:false,error:`${member.name} henüz karakter seçmedi.`});if(!room.ready[member.slot])return reply({ok:false,error:`${member.name} henüz hazır değil.`});}
    startMatch(room);reply({ok:true});
  });
  socket.on("skipIntro",()=>{const room=rooms.get(socket.data.room),member=room?.members.get(socket.id);if(!room||room.phase!=="intro"||!member)return;room.introSkipped[member.slot]=true;if(humanSlots(room).every((slot)=>room.introSkipped[slot]))beginPlay(room);});
  socket.on("returnLobby",()=>{const room=rooms.get(socket.data.room);if(room&&(room.hostId===socket.id||room.phase==="matchOver")){room.phase="lobby";room.winner=null;if(room.playMode==="single")room.stage=Math.floor(Math.random()*STAGE_COUNT);clearReady(room);emitLobby(room);}});
  socket.on("input",(input={})=>{const room=rooms.get(socket.data.room),member=room?.members.get(socket.id);if(room&&member)room.inputs.set(socket.id,{left:!!input.left,right:!!input.right,jump:!!input.jump,down:!!input.down});});
  socket.on("action",({type}={})=>{const room=rooms.get(socket.data.room),member=room?.members.get(socket.id),player=room?.players.find((item)=>item.side===member?.slot);if(room&&player&&["header","special"].includes(type))startAction(room,player,type);});
  socket.on("dash",({direction}={})=>{const room=rooms.get(socket.data.room),member=room?.members.get(socket.id),player=room?.players.find((item)=>item.side===member?.slot);if(room&&player)startDash(room,player,Math.sign(Number(direction)||0));});
  socket.on("disconnect",()=>leave(socket));
});

function createPlayer(side,character,width=WORLD_WIDTH){const stats=ROSTER[character],team=teamOf(side),role=side%2===0?"defender":"striker",wide=width>1500,positions=team===0?[wide?370:335,wide?625:500]:[width-(wide?370:335),width-(wide?625:500)];return{side,team,role,character,name:stats.name,x:positions[side%2],y:GROUND,vx:0,vy:0,facing:team?-1:1,moveIntent:0,onGround:true,crouching:false,energy:45,action:"idle",actionClock:0,actionDuration:0,actionHit:false,specialKind:null,dashTimer:0,dashCooldown:0,stun:0,carrySlow:0,jumpHeld:false,jumpBuffer:0,coyote:.1,landedId:0,aiCooldown:.2,goalCamp:0,goalCampLimit:2.45,goalZone:285,goalLock:0,pressureWarned:false};}
function createBall(_type=0,x=CENTER){const type=0,stats=BALLS[type];return{type,x,y:215,vx:(Math.random()-.5)*50,vy:0,spin:0,radius:stats.radius,lastTouch:null,lastTouchKind:null,touchLock:0,trailId:0,groundChain:0,groundTouchTimer:0,lastGroundTouchSide:null,popOwner:null,popAssistTimer:0,groundPopCooldown:0,pinTimer:0,pinCooldown:0,pinRepeatWindow:0,pinBurstCount:0,scrumTimer:0,scrumTeam:null,scrumCooldown:0,stallTimer:0,stallAnchorX:x,stallCooldown:0,lowPlayTimer:0,lowPlayCooldown:0,unpinGrace:0,floatTimer:0};}
function fillCpuSelections(room){const slots=activeSlots(room),used=new Set();for(let slot=0;slot<SLOT_COUNT;slot++)if(!slots.includes(slot))room.selections[slot]=null;for(const slot of slots)if(room.selections[slot]!==null)used.add(room.selections[slot]);for(const slot of slots)if(room.selections[slot]===null){const options=ROSTER.map((_,index)=>index).filter((index)=>!used.has(index)),choice=options[Math.floor(Math.random()*options.length)];room.selections[slot]=choice;used.add(choice);}}
function nextKickoffX(room){let side=Math.random()<.5?-1:1;if(side===room.lastKickoffSide&&room.kickoffStreak>=1&&Math.random()<.75)side*=-1;room.kickoffStreak=side===room.lastKickoffSide?room.kickoffStreak+1:1;room.lastKickoffSide=side;return room.worldWidth/2+side*(room.arenaSize==="wide"?70+Math.random()*110:55+Math.random()*80);}
function matchupTitle(a,b){const key=[a,b].sort((x,y)=>x-y).join("-");return{"0-1":"AKIL İLE HIZIN DÜELLOSU","0-2":"PLAN, DUVARA KARŞI","0-3":"FALSO, GÖKYÜZÜNE KARŞI","1-2":"HIZ DUVARI AŞABİLİR Mİ?","1-3":"HAVA KORİDORU SAVAŞI","2-3":"GÜÇ İLE İRTİFANIN ÇARPIŞMASI"}[key]||"KAMPÜSÜN BÜYÜK DÜELLOSU";}
function startMatch(room){fillCpuSelections(room);room.phase="intro";room.score=[0,0];room.timer=room.rules.duration;room.overtime=false;room.pause=0;room.kickoff=0;room.introRemaining=8;room.introSkipped=[false,false,false,false];room.winner=null;room.players=activeSlots(room).map((slot)=>createPlayer(slot,room.selections[slot],room.worldWidth));room.ball=createBall(room.ballType,nextKickoffX(room));room.storyIndices=room.selections.map((character)=>character===null?0:Math.floor(Math.random()*ROSTER[character].stories.length));room.introStories=room.selections.map((character,slot)=>character===null?"":ROSTER[character].stories[room.storyIndices[slot]]);const blue=room.players.filter((player)=>player.team===0).map((player)=>player.name).join(" & "),red=room.players.filter((player)=>player.team===1).map((player)=>player.name).join(" & ");room.matchupTitle=`${blue} — ${red}`;io.to(room.code).emit("matchStarted",publicState(room));emitLobby(room);}
function beginPlay(room){if(room.phase!=="intro")return;room.phase="playing";room.introRemaining=0;room.kickoff=1.15;io.to(room.code).emit("introEnded");emitLobby(room);}
function resetKickoff(room){room.players=activeSlots(room).map((slot)=>createPlayer(slot,room.selections[slot],room.worldWidth));room.ball=createBall(room.ballType,nextKickoffX(room));room.phase="playing";room.kickoff=1.05;io.to(room.code).emit("kickoff",{score:room.score,ballX:room.ball.x,lane:room.ball.x<room.worldWidth/2?"SOL":"SAĞ"});}

function canAct(player){return player&&player.stun<=0&&player.actionClock<=0&&player.dashTimer<=0;}
function startAction(room,player,type){
  if(room.phase!=="playing"||room.kickoff>0||!canAct(player))return false;const stats=ROSTER[player.character];
  if(type==="special"){
    if(player.energy<50)return false;player.energy-=50;player.specialKind=SPECIAL_KINDS[player.character];player.action="special";player.actionClock=player.specialKind==="quake"?.48:player.specialKind==="magnet"?.52:.42;player.actionDuration=player.actionClock;player.actionHit=false;
    if(player.specialKind==="burst")player.vx=player.facing*690;if(player.specialKind==="rocket"){player.vy=-760;player.vx=player.facing*410;player.onGround=false;}
    if(player.specialKind==="quake")quakeBall(room,player);io.to(room.code).emit("special",{side:player.side,kind:player.specialKind,name:stats.special});return true;
  }
  player.specialKind=null;player.action="header";player.actionClock=.27;player.actionDuration=.27;player.actionHit=false;return true;
}
function quakeBall(room,player){const ball=room.ball,dx=ball.x-player.x,dy=ball.y-(player.y-100);if(Math.abs(dx)<285&&Math.abs(dy)<235){ball.vx=player.facing*(650/Math.max(.75,BALLS[ball.type].mass));ball.vy=-650;ball.spin=player.facing*9;registerTouch(room,player,true,"quake");}}
function magnetBall(room,player){const ball=room.ball,targetX=player.x+player.facing*50,targetY=player.y+HITBOX.headY,dx=targetX-ball.x,dy=targetY-ball.y;if(Math.abs(dx)>340||Math.abs(dy)>300)return false;ball.vx=approach(ball.vx,clamp(dx*4.2,-620,620),55);ball.vy=approach(ball.vy,clamp(dy*4.2,-720,420),60);ball.spin=approach(ball.spin,player.facing*4,.45);return true;}
function startDash(room,player,direction){if(room.phase!=="playing"||room.kickoff>0||!canAct(player)||player.dashCooldown>0)return false;const dir=direction||player.facing;player.dashTimer=.15;player.dashCooldown=.52;player.vx=dir*690;player.action="dash";io.to(room.code).emit("dashFx",{side:player.side,direction:dir});return true;}

function getInput(room,player){const socketId=room.controllers[player.side];if(socketId)return room.inputs.get(socketId)||{};return aiInput(room,player);}
function aiInput(room,player){
  const difficulty=room.cpuDifficulty||"normal",profile={easy:{prediction:.1,speed:.86,reaction:.24,variance:.11,special:.18,dash:.09},normal:{prediction:.16,speed:1,reaction:.1,variance:.12,special:.34,dash:.18},hard:{prediction:.22,speed:1,reaction:.065,variance:.065,special:.48,dash:.27}}[difficulty]||{prediction:.16,speed:1,reaction:.1,variance:.12,special:.34,dash:.18};
  const width=room.worldWidth||WORLD_WIDTH,ball=room.ball,team=player.team,ownGoal=team===0?LEFT_LINE:width-LEFT_LINE,attackDir=team===0?1:-1,input={left:false,right:false,jump:false,down:false,cpuScale:profile.speed};
  const duel=room.format==="1v1",predictedX=clamp(ball.x+ball.vx*profile.prediction,PLAYER_LEFT,width-PLAYER_LEFT),ballToOwn=Math.abs(ball.x-ownGoal),ownHalf=team===0?ball.x<width*.52:ball.x>width*.48,danger=ballToOwn<(duel?520:player.role==="defender"?500:350),pressRange=Math.abs(ball.x-player.x)<width*.23;
  const chase=predictedX-attackDir*(duel?72:player.role==="defender"?84:56),support=team===0?width*.44:width*.56,desired=duel?chase:player.role==="striker"||danger||ownHalf||pressRange?chase:support;
  if(Math.abs(desired-player.x)>18)input[desired<player.x?"left":"right"]=true;
  const headY=player.y+HITBOX.headY,closeX=Math.abs(ball.x-player.x)<118,ballAbove=ball.y<headY+55,ballAhead=(ball.x-player.x)*attackDir>-14,approachingOwn=ball.vx*attackDir<-75,lowThreat=ball.y>GROUND-175&&danger&&closeX&&(!ballAhead||approachingOwn);
  if(lowThreat&&player.onGround)input.down=true;
  else if(player.onGround&&closeX&&ballAhead&&(ballAbove||ball.y<GROUND-70||danger&&approachingOwn))input.jump=true;
  if(!player.onGround&&ball.y>player.y-30)input.down=true;
  player.aiCooldown-=DT;
  if(player.aiCooldown<=0){player.aiCooldown=profile.reaction+Math.random()*profile.variance;const strikeWindow=closeX&&ballAhead&&Math.abs(ball.y-headY)<135;if(strikeWindow&&!lowThreat)startAction(room,player,"header");else if(player.energy>=50&&ballAhead&&((danger&&ballToOwn<285)||Math.abs(ball.x-player.x)<230)&&Math.random()<profile.special)startAction(room,player,"special");else if(Math.abs(desired-player.x)>230&&Math.random()<profile.dash)startDash(room,player,desired<player.x?-1:1);}
  return input;
}

function updatePlayer(room,player,input){
  const stats=ROSTER[player.character];player.crouching=!!input.down&&player.onGround&&!input.jump&&player.actionClock<=0&&player.dashTimer<=0&&player.stun<=0;player.moveIntent=(input.right?1:0)-(input.left?1:0);player.stun=Math.max(0,player.stun-DT);player.carrySlow=Math.max(0,player.carrySlow-DT);player.dashCooldown=Math.max(0,player.dashCooldown-DT);player.energy=clamp(player.energy+5.1*DT,0,100);player.coyote=player.onGround?.1:Math.max(0,player.coyote-DT);player.jumpBuffer=Math.max(0,player.jumpBuffer-DT);
  const jumpPressed=!!input.jump&&!player.jumpHeld;if(jumpPressed)player.jumpBuffer=.13;player.jumpHeld=!!input.jump;
  if(player.actionClock>0){player.actionClock=Math.max(0,player.actionClock-DT);if(player.actionClock===0){player.action="idle";player.specialKind=null;}}
  if(player.dashTimer>0){player.dashTimer=Math.max(0,player.dashTimer-DT);if(player.dashTimer===0)player.vx*=.38;}
  else if(player.stun<=0){const direction=(input.right?1:0)-(input.left?1:0),control=player.onGround?1:stats.air*.55,cpuScale=Number.isFinite(input.cpuScale)?clamp(input.cpuScale,.75,1):1,target=direction*stats.speed*cpuScale*(player.carrySlow>0?.46:1)*(player.crouching?.28:1);player.vx=approach(player.vx,target,stats.accel*control*DT);}
  if(player.jumpBuffer>0&&player.coyote>0&&player.stun<=0){player.crouching=false;player.vy=-stats.jump;player.onGround=false;player.coyote=0;player.jumpBuffer=0;player.action="jump";io.to(room.code).emit("jumpFx",{side:player.side,x:player.x});}
  if(!input.jump&&player.vy<-170)player.vy+=34;if(input.down&&!player.onGround)player.vy+=58;
  const width=room.worldWidth||WORLD_WIDTH,strictKeeper=room.format==="2v2"&&room.arenaSize==="wide",duelKeeper=room.format==="1v1",campLimit=strictKeeper?1.55:duelKeeper?2:2.45,goalZone=strictKeeper?370:duelKeeper?320:285,lockSeconds=strictKeeper?5:duelKeeper?4.8:0,lockDistance=strictKeeper?150:duelKeeper?110:0,deepZone=player.team===0?player.x<goalZone:player.x>width-goalZone,stationary=Math.abs(player.vx)<95;
  player.goalCampLimit=campLimit;player.goalZone=goalZone;player.goalLock=Math.max(0,(player.goalLock||0)-DT);
  if(strictKeeper||duelKeeper){
    if(player.goalLock>0)player.goalCamp=0;else if(deepZone&&player.onGround)player.goalCamp=Math.min(campLimit,player.goalCamp+DT*(stationary?1:.62));else player.goalCamp=Math.max(0,player.goalCamp-DT*2.05);
    if(player.goalCamp>=campLimit&&player.goalLock<=0){player.goalLock=lockSeconds;player.goalCamp=0;player.pressureWarned=true;io.to(room.code).emit("antiCamp",{side:player.side,seconds:lockSeconds,strict:true});}
    if(player.goalLock<=0&&player.goalCamp<.35)player.pressureWarned=false;
  }else{
    if(deepZone&&player.onGround&&stationary)player.goalCamp=Math.min(5,player.goalCamp+DT);else player.goalCamp=Math.max(0,player.goalCamp-DT*1.65);
    if(player.goalCamp>campLimit&&!player.pressureWarned){player.pressureWarned=true;io.to(room.code).emit("antiCamp",{side:player.side});}if(player.goalCamp<.8)player.pressureWarned=false;
  }
  const pressureDistance=(strictKeeper||duelKeeper)?(player.goalLock>0?lockDistance:0):clamp((player.goalCamp-campLimit)*48,0,74),leftBound=PLAYER_LEFT+(player.team===0?pressureDistance:0),rightBound=width-PLAYER_LEFT-(player.team===1?pressureDistance:0);
  player.vy+=1670*DT;player.x+=player.vx*DT;player.y+=player.vy*DT;
  if(player.y>=GROUND){if(!player.onGround&&player.vy>180){player.landedId++;io.to(room.code).emit("landFx",{side:player.side,x:player.x});}player.y=GROUND;player.vy=0;player.onGround=true;if(player.actionClock<=0)player.action=player.crouching?"crouch":Math.abs(player.vx)>40?"run":"idle";}else{player.onGround=false;player.crouching=false;}
  player.x=clamp(player.x,leftBound,rightBound);if(player.x<=leftBound&&player.vx<0)player.vx=0;if(player.x>=rightBound&&player.vx>0)player.vx=0;
}

function resolvePlayerOverlap(a,b){const dx=b.x-a.x,min=76;if(Math.abs(dx)<min&&Math.abs(a.y-b.y)<125){const push=(min-Math.abs(dx))/2,sign=dx>=0?1:-1;a.x-=push*sign;b.x+=push*sign;a.vx-=35*sign;b.vx+=35*sign;}}
function resolveTeamScrum(room){
  const ball=room.ball,width=room.worldWidth||WORLD_WIDTH;if(!ball||ball.scrumCooldown>0||ball.y<GROUND-165){if(ball)ball.scrumTimer=Math.max(0,(ball.scrumTimer||0)-DT*3);return false;}
  const cluster=room.players.filter((player)=>player.onGround&&Math.abs(player.x-ball.x)<155&&Math.abs(player.y-GROUND)<3);if(cluster.length!==3){ball.scrumTimer=Math.max(0,(ball.scrumTimer||0)-DT*3);ball.scrumTeam=null;return false;}
  const teams=[cluster.filter((player)=>player.team===0),cluster.filter((player)=>player.team===1)],majorityTeam=teams[0].length===2&&teams[1].length===1?0:teams[1].length===2&&teams[0].length===1?1:null;if(majorityTeam===null){ball.scrumTimer=0;ball.scrumTeam=null;return false;}
  const majority=teams[majorityTeam],minority=teams[1-majorityTeam][0],average=majority.reduce((sum,player)=>sum+player.x,0)/majority.length,offset=minority.x-average,direction=Math.sign(offset)||(majorityTeam===0?1:-1),formation=Math.abs(offset)>18&&majority.every((player)=>(minority.x-player.x)*direction>-48),pressing=majority.some((player)=>player.moveIntent===direction||player.vx*direction>95);
  if(!formation||!pressing){ball.scrumTimer=Math.max(0,(ball.scrumTimer||0)-DT*2.5);if(ball.scrumTimer===0)ball.scrumTeam=null;return false;}
  if(ball.scrumTeam!==majorityTeam){ball.scrumTeam=majorityTeam;ball.scrumTimer=0;}ball.scrumTimer+=DT;if(ball.scrumTimer<.14)return false;
  minority.vx=approach(minority.vx,direction*190,34);minority.x=clamp(minority.x+direction*.75,PLAYER_LEFT,width-PLAYER_LEFT);majority.forEach((player)=>{player.vx=approach(player.vx,direction*230,15);player.x=clamp(player.x+direction*.34,PLAYER_LEFT,width-PLAYER_LEFT);});ball.vx=approach(ball.vx,direction*245,28);ball.x=clamp(ball.x+direction*.38,18+ball.radius,width-18-ball.radius);ball.vy=Math.min(ball.vy,-85);
  if(ball.scrumTimer<.58)return true;ball.vx=direction*480;ball.vy=-520;ball.spin=direction*3.5;ball.scrumTimer=0;ball.scrumTeam=null;ball.scrumCooldown=1.2;ball.pinCooldown=Math.max(ball.pinCooldown,.8);ball.unpinGrace=Math.max(ball.unpinGrace,.18);ball.groundPopCooldown=Math.max(ball.groundPopCooldown,.25);minority.vx=direction*260;io.to(room.code).emit("teamPush",{team:majorityTeam,x:ball.x,y:ball.y,direction,ballType:ball.type,speed:Math.round(Math.hypot(ball.vx,ball.vy))});return true;
}
function collideBallCircle(room,player,cx,cy,radius,isHead){
  const ball=room.ball,stats=BALLS[ball.type],incomingSpeed=Math.hypot(ball.vx,ball.vy),active=player.actionClock>player.actionDuration-.22&&player.actionClock<player.actionDuration-.055,lowBall=ball.y+ball.radius>GROUND-14,dx=ball.x-cx,dy=ball.y-cy,min=ball.radius+radius,distSq=dx*dx+dy*dy;if(distSq>=min*min)return false;
  // Yerdeki top görsel olarak kafaya değmez. Pasif kafa çarpışmasını atlamak,
  // aynı karede kafa+gövdenin topa iki kez yatay enerji vermesini önler.
  if(isHead&&!active&&player.onGround&&lowBall)return false;
  const dist=Math.sqrt(distSq)||.001,nx=dx/dist,ny=dy/dist,overlap=min-dist;ball.x+=nx*overlap;ball.y+=ny*overlap;
  const groundBody=!isHead&&player.onGround&&lowBall,relative=(ball.vx-player.vx)*nx+(ball.vy-player.vy)*ny;if(relative<0){const passiveHead=isHead&&!active,restitution=groundBody?.5:passiveHead?.55:isHead?.88:.72,impulse=-(1+restitution)*relative,transfer=groundBody?.1:passiveHead?.06:.18;ball.vx+=nx*impulse+player.vx*transfer;ball.vy+=ny*impulse+player.vy*.14;}
  if(isHead&&active&&!player.actionHit){
    const power=ROSTER[player.character].power,heavy=Math.max(.72,stats.mass),aerial=!player.onGround||ball.y<GROUND-150,popCombo=!player.onGround&&ball.popAssistTimer>0&&ball.popOwner===player.team;let horizontal=560*power/heavy,vertical=430*power/heavy;if(aerial){horizontal*=1.1;vertical*=1.08;}if(popCombo){horizontal*=1.16;vertical*=1.08;}
    if(player.specialKind==="curve"){horizontal*=1.12;vertical*=1.08;ball.spin=player.facing*18;}
    if(player.specialKind==="burst")horizontal*=1.38;if(player.specialKind==="rocket"){horizontal*=1.24;vertical*=1.34;}if(player.specialKind==="magnet"){horizontal*=.94;vertical*=1.12;}if(player.specialKind==="counter"){const counterScale=clamp(incomingSpeed/700,.88,1.28);horizontal*=1.12*counterScale;vertical*=1.08;ball.spin-=player.facing*incomingSpeed*.008;}if(player.specialKind==="lodos"){horizontal*=.96;vertical*=1.32;}
    ball.vx=player.facing*horizontal+player.vx*.42;ball.vy=Math.min(ball.vy,-vertical+player.vy*.2);ball.spin+=player.facing*(player.specialKind?10:4);
    if(player.specialKind==="precision"){const width=room.worldWidth||WORLD_WIDTH,targetX=player.team===0?width-LEFT_LINE:LEFT_LINE,targetY=goalTopFor(room)+24,distanceX=targetX-ball.x,flight=clamp(Math.abs(distanceX)/820,.55,1.35);ball.vx=distanceX/flight+player.vx*.12;ball.vy=clamp((targetY-ball.y-.5*stats.gravity*flight*flight)/flight,-780,-180);ball.spin=0;}
    if(player.specialKind==="lodos"){ball.floatTimer=.72;ball.spin+=player.facing*4;}
    ball.groundChain=0;ball.groundTouchTimer=0;ball.lastGroundTouchSide=null;ball.popOwner=null;ball.popAssistTimer=0;ball.lowPlayTimer=0;player.actionHit=true;registerTouch(room,player,!!player.specialKind,player.specialKind||popCombo&&"popCombo"||aerial&&"aerial"||"header");
  }else{
    const width=room.worldWidth||WORLD_WIDTH,attackDirection=player.team===0?1:-1,ownGoalDistance=player.team===0?player.x-LEFT_LINE:width-LEFT_LINE-player.x,crouchBlock=player.crouching&&ownGoalDistance<width*.34&&ball.y>GROUND-195&&(groundBody||ball.vx*attackDirection<-75),keeperDeflection=!crouchBlock&&ownGoalDistance<235&&incomingSpeed>340;
    if(crouchBlock){const clearSpeed=Math.max(270,Math.min(535,incomingSpeed*.72+135));ball.vx=attackDirection*clearSpeed;ball.vy=Math.min(ball.vy,-345);ball.spin=attackDirection*3.2;ball.groundChain=0;ball.groundTouchTimer=0;ball.lastGroundTouchSide=null;ball.popOwner=null;ball.popAssistTimer=0;ball.groundPopCooldown=Math.max(ball.groundPopCooldown,.34);player.vx*=.12;player.carrySlow=Math.max(player.carrySlow,.16);if(ball.touchLock<=0)registerTouch(room,player,false,"crouchBlock");}
    if(keeperDeflection){const outgoing=Math.hypot(ball.vx,ball.vy)||1,targetSpeed=Math.min(stats.max,incomingSpeed*.9);if(outgoing<targetSpeed){ball.vx*=targetSpeed/outgoing;ball.vy*=targetSpeed/outgoing;}ball.vy-=72;ball.spin+=(player.team===0?1:-1)*3.5;}
    let touchKind=keeperDeflection?"keeperDeflection":isHead?"head":"body",passiveCarry=!active&&player.onGround&&(ball.x-player.x)*attackDirection> -30&&player.vx*attackDirection>80;
    if(!crouchBlock&&groundBody&&(relative< -95||passiveCarry)&&ball.groundPopCooldown<=0){const approachSpeed=Math.max(95,-relative),chained=ball.lastGroundTouchSide===player.side&&ball.groundTouchTimer>0;ball.groundChain=chained?Math.min(4,Math.floor(ball.groundChain)+1):1;ball.lastGroundTouchSide=player.side;ball.groundTouchTimer=.88;ball.popOwner=player.team;ball.popAssistTimer=1.22;ball.groundPopCooldown=.3;const direction=Math.sign(ball.vx)||player.facing,horizontal=Math.min(175,82+approachSpeed*.24),lift=Math.min(760,625+(ball.groundChain-1)*62+Math.min(55,approachSpeed*.12));ball.vx=direction*horizontal;ball.vy=-lift;player.vx*=.18;player.carrySlow=Math.max(player.carrySlow,.2);const liftedSpeed=Math.hypot(ball.vx,ball.vy);if(liftedSpeed>stats.max){ball.vx*=stats.max/liftedSpeed;ball.vy*=stats.max/liftedSpeed;}ball.spin+=direction*2.2;touchKind=keeperDeflection?touchKind:"toePop";}
    else if(!crouchBlock&&passiveCarry&&!keeperDeflection){ball.vx=attackDirection*Math.min(145,Math.max(55,Math.abs(ball.vx)));ball.vy=Math.min(ball.vy,-90);player.vx*=.28;player.carrySlow=Math.max(player.carrySlow,.14);touchKind="softTrap";}
    if(!crouchBlock&&ball.touchLock<=0&&Math.abs(relative)>95)registerTouch(room,player,false,touchKind);
  }return true;
}
function registerTouch(room,player,special,kind){const ball=room.ball;ball.lastTouch=player.side;ball.lastTouchKind=kind;ball.touchLock=.085;ball.trailId++;const energy=special?11:kind==="popCombo"?12:kind==="aerial"?9:kind==="toePop"?3:kind==="softTrap"?1:5;player.energy=clamp(player.energy+energy,0,100);const speed=Math.hypot(ball.vx,ball.vy);io.to(room.code).emit("ballHit",{side:player.side,x:ball.x,y:ball.y,speed:Number(speed.toFixed(0)),special,kind,groundChain:ball.groundChain,ballType:ball.type});}
function clearestPinDirection(room,ball,players,toucher){const width=room.worldWidth||WORLD_WIDTH,score=(direction)=>{const target=clamp(ball.x+direction*330,PLAYER_LEFT+30,width-PLAYER_LEFT-30),clearance=players.length?Math.min(...players.map((player)=>Math.abs(target-player.x))):330,wallRoom=direction<0?ball.x-PLAYER_LEFT:width-PLAYER_LEFT-ball.x;return clearance+Math.min(420,Math.max(0,wallRoom))*.22;},left=score(-1),right=score(1);if(Math.abs(left-right)>18)return right>left?1:-1;if(toucher)return toucher.team===0?1:-1;return ball.x<width/2?1:-1;}
function resolveBallPin(room){
  const ball=room.ball,players=room.players;if(ball.pinCooldown>0){ball.pinTimer=Math.max(0,ball.pinTimer-DT*2.5);return false;}
  const nearby=players.filter((player)=>Math.abs(ball.x-player.x)<125),span=nearby.length?Math.max(...nearby.map((player)=>player.x))-Math.min(...nearby.map((player)=>player.x)):999,slowEnough=Math.hypot(ball.vx,ball.vy)<520,wedged=ball.y>GROUND-165&&nearby.length>=2&&span<225&&slowEnough;
  ball.pinTimer=wedged?ball.pinTimer+DT:Math.max(0,ball.pinTimer-DT*2.5);if(ball.pinTimer<.38)return false;
  const toucher=players.find((player)=>player.side===ball.lastTouch),repeated=ball.pinRepeatWindow>0&&ball.pinBurstCount>0;ball.pinBurstCount=repeated?Math.min(3,ball.pinBurstCount+1):1;const escalated=ball.pinBurstCount>=2,direction=clearestPinDirection(room,ball,players,toucher),horizontal=escalated?(ball.pinBurstCount>=3?700:590):360,lift=escalated?(ball.pinBurstCount>=3?840:780):660;
  ball.vx=direction*horizontal;ball.vy=-lift;ball.spin=direction*(escalated?7:4);ball.pinTimer=0;ball.pinCooldown=escalated?1.15:.95;ball.pinRepeatWindow=4.2;ball.unpinGrace=escalated?.3:.24;ball.groundChain=0;ball.groundTouchTimer=0;ball.lastGroundTouchSide=null;ball.popOwner=null;ball.popAssistTimer=0;
  nearby.forEach((player)=>{const away=Math.sign(player.x-ball.x)||(player.team===0?-1:1);player.vx+=away*(escalated?105:55);player.stun=0;});
  io.to(room.code).emit("ballUnpinned",{x:ball.x,y:ball.y,direction,ballType:ball.type,escalated,repeat:ball.pinBurstCount,speed:Math.round(Math.hypot(ball.vx,ball.vy))});return true;
}
function resolveCrowdStall(room){
  const ball=room.ball,players=room.players,width=room.worldWidth||WORLD_WIDTH;if(!ball||ball.stallCooldown>0)return false;if(ball.unpinGrace>0||ball.scrumCooldown>0){ball.stallTimer=0;ball.stallAnchorX=ball.x;return false;}
  const nearby=players.filter((player)=>Math.abs(player.x-ball.x)<190&&Math.abs(player.y-GROUND)<145),crowded=nearby.length>=2,low=ball.y>GROUND-190;if(!crowded||!low){ball.stallTimer=0;ball.stallAnchorX=ball.x;return false;}
  if(!Number.isFinite(ball.stallAnchorX))ball.stallAnchorX=ball.x;if(Math.abs(ball.x-ball.stallAnchorX)>95){ball.stallTimer=0;ball.stallAnchorX=ball.x;return false;}ball.stallTimer=(ball.stallTimer||0)+DT;if(ball.stallTimer<3.8)return false;
  const toucher=players.find((player)=>player.side===ball.lastTouch),direction=clearestPinDirection(room,ball,players,toucher);ball.x=clamp(ball.x+direction*14,18+ball.radius,width-18-ball.radius);ball.vx=direction*650;ball.vy=-790;ball.spin=direction*7;ball.stallTimer=0;ball.stallAnchorX=ball.x;ball.stallCooldown=2.1;ball.pinTimer=0;ball.pinCooldown=Math.max(ball.pinCooldown,1.25);ball.scrumTimer=0;ball.scrumTeam=null;ball.scrumCooldown=Math.max(ball.scrumCooldown,1.25);ball.unpinGrace=Math.max(ball.unpinGrace,.38);ball.groundChain=0;ball.groundTouchTimer=0;ball.lastGroundTouchSide=null;ball.popOwner=null;ball.popAssistTimer=0;
  nearby.forEach((player)=>{const away=Math.sign(player.x-ball.x)||-direction;player.vx+=away*115;player.stun=0;});io.to(room.code).emit("ballStallCleared",{x:ball.x,y:ball.y,direction,ballType:ball.type,speed:Math.round(Math.hypot(ball.vx,ball.vy))});return true;
}
function resolveLowPlayLoop(room){
  const ball=room.ball,width=room.worldWidth||WORLD_WIDTH;if(!ball)return false;if(ball.lowPlayCooldown>0)return false;
  // Küçük doğal sekmeler sayacı sıfırlamaz. Gerçek bir kafa yüksekliğine çıkan
  // top veya aktif kafa vuruşu ise yeni bir hücum fazı sayılır.
  if(ball.y<GROUND-175||ball.vy<-650){ball.lowPlayTimer=0;return false;}
  if(ball.y>GROUND-145)ball.lowPlayTimer=(ball.lowPlayTimer||0)+DT;else ball.lowPlayTimer=Math.max(0,(ball.lowPlayTimer||0)-DT*.55);
  if(ball.lowPlayTimer<5.5)return false;
  let direction=Math.sign(ball.vx);if(ball.x<PLAYER_LEFT+95)direction=1;else if(ball.x>width-PLAYER_LEFT-95)direction=-1;else if(!direction)direction=clearestPinDirection(room,ball,room.players,room.players.find((player)=>player.side===ball.lastTouch));
  ball.x=clamp(ball.x+direction*8,18+ball.radius,width-18-ball.radius);ball.vx=direction*clamp(Math.abs(ball.vx)*.58,190,360);ball.vy=-720;ball.spin=direction*4.5;ball.lowPlayTimer=0;ball.lowPlayCooldown=3.2;ball.pinTimer=0;ball.pinCooldown=Math.max(ball.pinCooldown,.85);ball.stallTimer=0;ball.stallCooldown=Math.max(ball.stallCooldown,1.1);ball.scrumTimer=0;ball.scrumTeam=null;ball.scrumCooldown=Math.max(ball.scrumCooldown,.85);ball.unpinGrace=Math.max(ball.unpinGrace,.3);ball.groundChain=0;ball.groundTouchTimer=0;ball.lastGroundTouchSide=null;ball.popOwner=null;ball.popAssistTimer=0;
  io.to(room.code).emit("lowBallLifted",{x:ball.x,y:ball.y,direction,ballType:ball.type,speed:Math.round(Math.hypot(ball.vx,ball.vy))});return true;
}
function isTopShelfShot(room,player){
  const ball=room.ball,width=room.worldWidth||WORLD_WIDTH,goalTop=goalTopFor(room),insideTopGap=ball.y>goalTop+4&&ball.y<goalTop+38;if(!insideTopGap)return false;
  return player.team===0?ball.vx<-120&&ball.x<PLAYER_LEFT-12:ball.vx>120&&ball.x>width-PLAYER_LEFT+12;
}
function collidePost(ball,px,py,radius=12){const dx=ball.x-px,dy=ball.y-py,min=ball.radius+radius,dist=Math.hypot(dx,dy);if(dist>=min||dist===0)return;const nx=dx/dist,ny=dy/dist;ball.x=px+nx*min;ball.y=py+ny*min;const relative=ball.vx*nx+ball.vy*ny;if(relative<0){ball.vx-=1.9*relative*nx;ball.vy-=1.9*relative*ny;ball.spin+=(-ny*ball.vx+nx*ball.vy)*.012;}}
function updateBall(room){
  const width=room.worldWidth||WORLD_WIDTH,rightLine=width-LEFT_LINE,goalTop=goalTopFor(room),ball=room.ball,stats=BALLS[ball.type];ball.touchLock=Math.max(0,ball.touchLock-DT);ball.groundTouchTimer=Math.max(0,ball.groundTouchTimer-DT);ball.popAssistTimer=Math.max(0,ball.popAssistTimer-DT);ball.groundPopCooldown=Math.max(0,ball.groundPopCooldown-DT);ball.pinCooldown=Math.max(0,ball.pinCooldown-DT);ball.scrumCooldown=Math.max(0,(ball.scrumCooldown||0)-DT);ball.stallCooldown=Math.max(0,(ball.stallCooldown||0)-DT);ball.lowPlayCooldown=Math.max(0,(ball.lowPlayCooldown||0)-DT);ball.pinRepeatWindow=Math.max(0,(ball.pinRepeatWindow||0)-DT);ball.floatTimer=Math.max(0,(ball.floatTimer||0)-DT);if(ball.pinRepeatWindow===0)ball.pinBurstCount=0;ball.unpinGrace=Math.max(0,ball.unpinGrace-DT);if(ball.popAssistTimer===0)ball.popOwner=null;if(ball.groundTouchTimer===0||ball.y+ball.radius<GROUND-34){ball.groundChain=Math.max(0,ball.groundChain-DT*2);if(ball.groundChain===0)ball.lastGroundTouchSide=null;}
  for(const player of room.players)if(player.specialKind==="magnet"&&player.actionClock>0)magnetBall(room,player);
  if(Math.abs(ball.spin)>.01){const oldVx=ball.vx;ball.vx+=-ball.spin*ball.vy*stats.curve;ball.vy+=ball.spin*oldVx*stats.curve;ball.spin*=.997;}
  ball.vy+=stats.gravity*(ball.floatTimer>0?.55:1)*DT;ball.vx*=stats.drag;ball.vy*=.9994;ball.x+=ball.vx*DT;ball.y+=ball.vy*DT;
  if(ball.unpinGrace<=0)for(const player of room.players){if(isTopShelfShot(room,player))continue;const active=player.actionClock>player.actionDuration-.22&&player.actionClock<player.actionDuration-.055,box=player.crouching?CROUCH_HITBOX:HITBOX,reach=active?player.facing*31:0,headHit=collideBallCircle(room,player,player.x+reach,player.y+box.headY,active?HITBOX.activeHeadRadius:box.headRadius,true),torsoHit=headHit?false:collideBallCircle(room,player,player.x,player.y+box.torsoY,box.torsoRadius,false);if(!headHit&&!torsoHit)collideBallCircle(room,player,player.x,player.y+box.bodyY,box.bodyRadius,false);}
  resolveBallPin(room);
  resolveCrowdStall(room);
  collidePost(ball,LEFT_LINE,goalTop);collidePost(ball,rightLine,goalTop);
  if(ball.y+ball.radius>GROUND){ball.y=GROUND-ball.radius;if(ball.vy>0){ball.vy=-ball.vy*stats.bounce;const groundSpeed=Math.abs(ball.vx);if(groundSpeed>250){const hopHeight=70+Math.min(30,(groundSpeed-250)*.04),antiRollHop=Math.min(560,Math.sqrt(2*stats.gravity*hopHeight));ball.vy=-Math.max(Math.abs(ball.vy),antiRollHop);}else if(Math.abs(ball.vy)<48)ball.vy=0;ball.vx*=.985;ball.spin+=ball.vx*.006;}}
  resolveLowPlayLoop(room);
  if(ball.y-ball.radius<CEILING){ball.y=CEILING+ball.radius;ball.vy=Math.abs(ball.vy)*stats.bounce;}
  if(ball.y-ball.radius<goalTop){if(ball.x-ball.radius<18){ball.x=18+ball.radius;ball.vx=Math.abs(ball.vx)*stats.bounce;}if(ball.x+ball.radius>width-18){ball.x=width-18-ball.radius;ball.vx=-Math.abs(ball.vx)*stats.bounce;}}
  const speed=Math.hypot(ball.vx,ball.vy);if(speed>stats.max){const scale=stats.max/speed;ball.vx*=scale;ball.vy*=scale;}
  if(ball.x<LEFT_LINE-8&&ball.y>goalTop+5)scoreGoal(room,1);else if(ball.x>rightLine+8&&ball.y>goalTop+5)scoreGoal(room,0);
}
function scoreGoal(room,side){if(room.phase!=="playing")return;room.score[side]++;room.phase="goalPause";room.pause=2.45;room.shake=.55;const scorer=room.ball.lastTouch;io.to(room.code).emit("goal",{side,scorer,score:room.score,x:room.ball.x,y:room.ball.y});if(room.score[side]>=room.rules.goalLimit)room.winner=side;}
function finishMatch(room,winner){if(room.phase==="matchOver")return;room.phase="matchOver";room.winner=winner;room.pause=0;io.to(room.code).emit("matchEnded",{winner,score:room.score});emitLobby(room);}

function update(room){
  if(room.phase==="intro"){room.introRemaining=Math.max(0,room.introRemaining-DT);if(room.introRemaining===0)beginPlay(room);return;}
  if(room.phase==="goalPause"){room.pause-=DT;if(room.pause<=0){if(room.winner!==null)finishMatch(room,room.winner);else resetKickoff(room);}return;}
  if(room.phase!=="playing")return;if(room.kickoff>0){room.kickoff=Math.max(0,room.kickoff-DT);return;}
  if(!room.overtime){room.timer=Math.max(0,room.timer-DT);if(room.timer===0){if(room.score[0]===room.score[1]){room.overtime=true;io.to(room.code).emit("overtime");}else{finishMatch(room,room.score[0]>room.score[1]?0:1);return;}}}
  for(const player of room.players)updatePlayer(room,player,getInput(room,player));for(let a=0;a<room.players.length;a++)for(let b=a+1;b<room.players.length;b++)resolvePlayerOverlap(room.players[a],room.players[b]);resolveTeamScrum(room);updateBall(room);for(const player of room.players)player.facing=room.ball.x>=player.x?1:-1;room.shake=Math.max(0,room.shake-DT);
}
function publicState(room){return{phase:room.phase,format:room.format,arenaSize:room.arenaSize,worldWidth:room.worldWidth,goalTop:goalTopFor(room),playMode:room.playMode,competition:room.competition,cpuDifficulty:room.cpuDifficulty,stage:room.stage,ballType:room.ballType,rules:room.rules,score:room.score,timer:room.timer,overtime:room.overtime,kickoff:room.kickoff,introRemaining:room.introRemaining,introSkipped:room.introSkipped,introStories:room.introStories,storyIndices:room.storyIndices,matchupTitle:room.matchupTitle,winner:room.winner,shake:room.shake,players:room.players.map((player)=>({...player,human:!!room.controllers[player.side],playerName:room.controllers[player.side]?room.members.get(room.controllers[player.side])?.name:"BİLGİSAYAR"})),ball:room.ball};}

function run(){let tick=0;setInterval(()=>{tick++;const now=Date.now();for(const [code,room] of rooms){if(room.emptySince&&now-room.emptySince>300000){rooms.delete(code);continue;}update(room);if(["intro","playing","goalPause","matchOver"].includes(room.phase)&&tick%3===0)io.to(room.code).emit("state",publicState(room));}},1000/FPS);server.listen(PORT,"0.0.0.0",()=>console.log(`Campus Head Ball 5.7.0 http://localhost:${PORT} adresinde hazır.`));}
if(require.main===module)run();
module.exports={BALLS,ROSTER,RULE_OPTIONS,AI_DIFFICULTIES,HITBOX,CROUCH_HITBOX,WORLD_WIDTH,ARENA_WIDTHS,STAGE_COUNT,GOAL_TOP,WIDE_GOAL_TOP,goalTopFor,LEFT_LINE,RIGHT_LINE,PLAYER_LEFT,PLAYER_RIGHT,activeSlots,nextKickoffX,createBall,createPlayer,aiInput,updatePlayer,updateBall,resolveTeamScrum,resolveBallPin,resolveCrowdStall,resolveLowPlayLoop,isTopShelfShot,collidePost,collideBallCircle,startAction,magnetBall};
