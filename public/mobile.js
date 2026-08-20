(()=>{
  const html=document.documentElement;
  let platform=null;
  const gameActive=()=>document.getElementById('game')?.classList.contains('active');
  const landscape=()=>innerWidth>innerHeight;
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)')?.matches===true||navigator.standalone===true;
  const ua=navigator.userAgent||'';
  const isIOS=()=>/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isIOSSafari=()=>isIOS()&&/Safari/i.test(ua)&&!/(CriOS|FxiOS|EdgiOS|OPiOS)/i.test(ua);

  // Platform selection is explicit on every fresh page load. It only changes the local control layer;
  // networking/rooms remain identical, so desktop and phone players stay cross-platform compatible.
  const gate=document.createElement('div');
  gate.id='platformGate';
  gate.innerHTML=`<section class="platform-card" role="dialog" aria-modal="true" aria-labelledby="platformTitle">
    <span class="platform-kicker">KONTROL TİPİ</span>
    <h2 id="platformTitle">Hangi cihazdan oynuyorsun?</h2>
    <p>Kontrolleri cihazına göre hazırlayalım. Multiplayer odaları iki platform arasında ortaktır.</p>
    <div class="platform-options">
      <button type="button" class="platform-option" data-platform="desktop"><span class="platform-icon">⌨</span><b>BİLGİSAYAR</b><small>Klavye kontrolleri</small></button>
      <button type="button" class="platform-option" data-platform="mobile"><span class="platform-icon">▯</span><b>TELEFON</b><small>Joystick + J / K</small></button>
    </div>
    <div id="platformError" class="platform-error" aria-live="polite"></div>
    <button type="button" id="platformContinue" class="platform-continue">DEVAM ET</button>
  </section>`;
  document.body.appendChild(gate);
  const platformError=document.getElementById('platformError');
  const continueBtn=document.getElementById('platformContinue');
  const optionBtns=[...gate.querySelectorAll('.platform-option')];
  optionBtns.forEach(btn=>btn.addEventListener('click',()=>{
    platform=btn.dataset.platform;
    optionBtns.forEach(x=>x.classList.toggle('selected',x===btn));
    platformError.textContent='';
  }));

  const controls=document.createElement('div');
  controls.id='mobileControls';
  controls.setAttribute('aria-hidden','true');
  controls.innerHTML=`<div id="mobileJoystick" class="mobile-joystick"><div class="mobile-joystick-ring"></div><div id="mobileJoystickKnob" class="mobile-joystick-knob"></div><span class="joy-hint joy-up">ZIPLA</span><span class="joy-hint joy-left">←</span><span class="joy-hint joy-right">→</span><span class="joy-hint joy-down">EĞİL</span></div><div class="mobile-actions"><button id="mobileHeader" class="mobile-action mobile-j" type="button"><b>J</b><span>KAFA</span></button><button id="mobileSpecial" class="mobile-action mobile-k" type="button"><b>K</b><span>ÖZEL</span></button></div>`;
  document.body.appendChild(controls);

  const rotate=document.createElement('div');
  rotate.id='rotateNotice';
  rotate.innerHTML='<div class="rotate-phone">↻</div><b>TELEFONU YATAY ÇEVİR</b><span>Maç yatay ekranda oynanır.</span>';
  document.body.appendChild(rotate);

  const pwaGuide=document.createElement('div');
  pwaGuide.id='pwaGuide';
  pwaGuide.innerHTML=`<section class="pwa-card" role="dialog" aria-modal="true" aria-labelledby="pwaGuideTitle">
    <span class="platform-kicker">IPHONE • TAM EKRAN / FULL SCREEN</span>
    <h2 id="pwaGuideTitle">Kafa Topu'nu Tam Ekran Oyna<br><span>Play Kafa Topu Full Screen</span></h2>
    <div class="pwa-copy">
      <p><b>TR</b> En iyi oyun deneyimi için Kafa Topu'nu ana ekranına ekle. Bundan sonra oyun uygulama gibi ayrı pencerede açılır.</p>
      <p><b>EN</b> For the best experience, add Kafa Topu to your Home Screen. After that, the game opens in its own app-like window.</p>
    </div>
    <div class="pwa-path-block"><small>TÜRKÇE</small><div class="pwa-path"><b>Paylaş</b><i>→</i><b>Ana Ekrana Ekle</b><i>→</i><b>Web Uygulaması Olarak Aç</b><i>→</i><b>Ekle</b></div></div>
    <div class="pwa-path-block"><small>ENGLISH</small><div class="pwa-path"><b>Share</b><i>→</i><b>Add to Home Screen</b><i>→</i><b>Open as Web App</b><i>→</i><b>Add</b></div></div>
    <div class="pwa-actions"><button id="pwaUnderstood" type="button" class="pwa-primary">ANLADIM / GOT IT</button><button id="pwaLater" type="button" class="pwa-secondary">ŞİMDİ DEĞİL / NOT NOW</button><button id="browserFullscreen" type="button" class="pwa-fullscreen hidden">⛶ TAM EKRAN / FULL SCREEN</button></div>
  </section>`;
  document.body.appendChild(pwaGuide);

  const joystick=document.getElementById('mobileJoystick');
  const knob=document.getElementById('mobileJoystickKnob');
  const headerBtn=document.getElementById('mobileHeader');
  const specialBtn=document.getElementById('mobileSpecial');
  const fullscreenBtn=document.getElementById('browserFullscreen');
  let activePointer=null;
  let jumpIntent=false,jumpSeenAirborne=false,jumpPulseTimer=null,jumpPulseTimeout=null,lastJumpPulse=0;
  const setKey=(code,value)=>{ if(typeof keys!=='undefined') keys[code]=value; };
  function currentMobilePlayer(){
    try{return typeof playerBySide==='function'&&typeof mySide!=='undefined'?playerBySide(mySide):null;}catch{return null;}
  }
  function stopJumpRepeat(){
    jumpIntent=false;jumpSeenAirborne=false;
    if(jumpPulseTimer){clearInterval(jumpPulseTimer);jumpPulseTimer=null;}
    if(jumpPulseTimeout){clearTimeout(jumpPulseTimeout);jumpPulseTimeout=null;}
    setKey('KeyW',false);
  }
  function jumpRepeatTick(){
    if(!jumpIntent||platform!=='mobile'||!gameActive()){stopJumpRepeat();return;}
    const player=currentMobilePlayer();
    if(!player){setKey('KeyW',true);return;}
    if(!player.onGround){jumpSeenAirborne=true;setKey('KeyW',true);return;}
    const now=performance.now();
    if(jumpSeenAirborne&&now-lastJumpPulse>120){
      jumpSeenAirborne=false;lastJumpPulse=now;
      // Sunucu zıplamayı yeni basış kenarında başlatıyor. Bu kısa bırakma yalnızca
      // yere değildiğinde yapılır; havadaki zıplama yüksekliğini/fiziğini değiştirmez.
      setKey('KeyW',false);
      if(jumpPulseTimeout)clearTimeout(jumpPulseTimeout);
      jumpPulseTimeout=setTimeout(()=>{if(jumpIntent&&platform==='mobile'&&gameActive())setKey('KeyW',true);},55);
    }
  }
  function setJumpIntent(active){
    if(!active){stopJumpRepeat();return;}
    if(jumpIntent)return;
    jumpIntent=true;jumpSeenAirborne=false;setKey('KeyW',true);
    jumpPulseTimer=setInterval(jumpRepeatTick,33);
  }

  // Analog interpretation constants. Horizontal movement intentionally has generous vertical tolerance.
  // Crouch has a narrower downward cone and a larger magnitude threshold to avoid accidental crouches.
  const JOY={dead:0.10,horizontal:0.16,jumpY:-0.38,jumpMagnitude:0.40,crouchY:0.80,crouchMagnitude:0.84,crouchDominance:1.55};
  function interpretJoystick(nx,ny,magnitude=Math.min(1,Math.hypot(nx,ny))){
    if(magnitude<JOY.dead)return{left:false,right:false,jump:false,down:false};
    const down=ny>=JOY.crouchY&&magnitude>=JOY.crouchMagnitude&&ny>=Math.abs(nx)*JOY.crouchDominance;
    const left=!down&&nx<=-JOY.horizontal;
    const right=!down&&nx>=JOY.horizontal;
    const jump=ny<=JOY.jumpY&&magnitude>=JOY.jumpMagnitude;
    return{left,right,jump,down};
  }

  function resetJoystick(){
    activePointer=null;
    stopJumpRepeat();
    ['KeyA','KeyD','KeyS'].forEach(k=>setKey(k,false));
    knob.style.transform='translate3d(0,0,0)';
    joystick.classList.remove('active');
  }
  function updateJoystick(clientX,clientY){
    const rect=joystick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const rawX=clientX-cx,rawY=clientY-cy;
    const max=rect.width*.25,rawLength=Math.hypot(rawX,rawY)||1;
    const magnitude=Math.min(1,rawLength/max);
    let dx=rawX,dy=rawY;
    if(rawLength>max){dx=rawX/rawLength*max;dy=rawY/rawLength*max;}
    knob.style.transform=`translate3d(${dx}px,${dy}px,0)`;
    const nx=dx/max,ny=dy/max;
    const intent=interpretJoystick(nx,ny,magnitude);
    setKey('KeyA',intent.left);setKey('KeyD',intent.right);setJumpIntent(intent.jump);setKey('KeyS',intent.down);
  }
  joystick.addEventListener('pointerdown',event=>{
    if(platform!=='mobile'||!gameActive())return;
    event.preventDefault();activePointer=event.pointerId;joystick.setPointerCapture?.(event.pointerId);
    joystick.classList.add('active');updateJoystick(event.clientX,event.clientY);
  });
  joystick.addEventListener('pointermove',event=>{
    if(event.pointerId!==activePointer)return;event.preventDefault();updateJoystick(event.clientX,event.clientY);
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>joystick.addEventListener(type,event=>{
    if(activePointer!==null&&event.pointerId!==undefined&&event.pointerId!==activePointer)return;resetJoystick();
  }));

  function actionButton(button,type){
    button.addEventListener('pointerdown',event=>{
      if(platform!=='mobile'||!gameActive())return;
      event.preventDefault();button.classList.add('pressed');
      if(typeof socket!=='undefined')socket.emit('action',{type});
      navigator.vibrate?.(12);
    });
    ['pointerup','pointercancel','pointerleave'].forEach(t=>button.addEventListener(t,event=>{event.preventDefault();button.classList.remove('pressed');}));
  }
  actionButton(headerBtn,'header');actionButton(specialBtn,'special');

  // Normal iPhone Safari girişlerinde her sayfa yüklemesinde gösterilir.
  // Kullanıcı Ana Ekran/PWA ikonundan standalone açtıysa kesinlikle gösterilmez.
  // Kapatma tercihini localStorage'a yazmıyoruz; böylece sonraki browser girişinde yeniden görünür.
  function shouldShowPwaGuide(){
    return platform==='mobile'&&isIOSSafari()&&!isStandalone();
  }
  function showPwaGuide(){if(shouldShowPwaGuide())pwaGuide.classList.add('show');}
  function closePwaGuide(){pwaGuide.classList.remove('show');}
  document.getElementById('pwaUnderstood').addEventListener('click',closePwaGuide);
  document.getElementById('pwaLater').addEventListener('click',closePwaGuide);
  pwaGuide.addEventListener('pointerdown',event=>{if(event.target===pwaGuide)closePwaGuide();});


  // Single-player-only match controls. These only send authoritative requests to the
  // server; multiplayer rooms never expose or accept them.
  const soloControls=document.createElement('div');
  soloControls.id='soloMatchControls';
  soloControls.innerHTML=`<button id="soloPauseBtn" type="button">Ⅱ DURAKLAT</button><button id="soloRestartBtn" type="button">↻ YENİDEN BAŞLAT</button>`;
  document.body.appendChild(soloControls);
  const pauseBadge=document.createElement('div');
  pauseBadge.id='soloPauseBadge';pauseBadge.innerHTML='<b>Ⅱ DURAKLATILDI</b><span>Devam etmek için DURAKLAT tuşuna bas.</span>';
  document.body.appendChild(pauseBadge);
  const endActions=document.querySelector('#endOverlay .end-actions');
  const endRestartBtn=document.createElement('button');
  endRestartBtn.id='soloEndRestartBtn';endRestartBtn.className='quit-button hidden';endRestartBtn.type='button';endRestartBtn.textContent='↻ MAÇI YENİDEN BAŞLAT';
  endActions?.insertBefore(endRestartBtn,endActions.firstChild);
  const pauseBtn=document.getElementById('soloPauseBtn'),restartBtn=document.getElementById('soloRestartBtn');
  let careerRestartSnapshot=null;
  const isSolo=()=>{try{return room?.playMode==='single'||state?.playMode==='single';}catch{return false;}};
  const currentPhase=()=>{try{return state?.phase||room?.phase||'';}catch{return'';}};
  function cloneCareer(){try{return activeCareer?JSON.parse(JSON.stringify(activeCareer)):null;}catch{return null;}}
  function restoreCareerSnapshot(){
    if(!careerRestartSnapshot)return;
    try{activeCareer=JSON.parse(JSON.stringify(careerRestartSnapshot));if(typeof saveCareer==='function')saveCareer(activeCareer);}catch{}
  }
  function setPausedUI(paused){
    pauseBtn.textContent=paused?'▶ DEVAM':'Ⅱ DURAKLAT';
    pauseBtn.classList.toggle('active',!!paused);pauseBadge.classList.toggle('show',!!paused&&isSolo()&&gameActive());
    if(paused&&platform==='mobile')resetJoystick();
  }
  function syncSoloControls(){
    const solo=isSolo(),active=gameActive(),phase=currentPhase();
    const live=solo&&active&&['playing','goalPause'].includes(phase);
    soloControls.classList.toggle('show',live);
    endRestartBtn.classList.toggle('hidden',!(solo&&active&&phase==='matchOver'));
    if(!solo||!active)setPausedUI(false);
  }
  function restartSolo(fromEnd=false){
    if(!isSolo())return;
    if(!fromEnd&&!window.confirm('Maçı baştan başlatmak istiyor musun?'))return;
    restoreCareerSnapshot();setPausedUI(false);resetJoystick();
    socket.emit('restartSoloMatch',{},result=>{
      if(!result?.ok){try{toast(result?.error||'Maç yeniden başlatılamadı.');}catch{}return;}
      document.getElementById('endOverlay')?.classList.add('hidden');
    });
  }
  pauseBtn.addEventListener('click',()=>{
    if(!isSolo())return;
    socket.emit('toggleSoloPause',{},result=>{if(result?.ok)setPausedUI(!!result.paused);});
  });
  restartBtn.addEventListener('click',()=>restartSolo(false));
  endRestartBtn.addEventListener('click',()=>restartSolo(true));
  socket.on('matchStarted',()=>{careerRestartSnapshot=cloneCareer();setPausedUI(false);setTimeout(syncSoloControls,0);});
  socket.on('soloPause',payload=>setPausedUI(!!payload?.paused));
  socket.on('soloRestarted',()=>{document.getElementById('endOverlay')?.classList.add('hidden');setPausedUI(false);setTimeout(syncSoloControls,0);});
  socket.on('state',next=>{if(next?.playMode==='single'){setPausedUI(!!next.paused);setTimeout(syncSoloControls,0);}});

  const fullscreenSupported=!!document.documentElement.requestFullscreen;
  fullscreenBtn.classList.toggle('hidden',!fullscreenSupported||isStandalone());
  fullscreenBtn.addEventListener('click',async()=>{
    if(!document.documentElement.requestFullscreen)return;
    try{await document.documentElement.requestFullscreen({navigationUI:'hide'});}catch{}
  });

  function syncPlatform(){
    html.classList.toggle('platform-mobile',platform==='mobile');
    html.classList.toggle('platform-desktop',platform==='desktop');
    html.classList.toggle('pwa-standalone',isStandalone());
    const active=gameActive(),wide=landscape();
    controls.classList.toggle('show',platform==='mobile'&&active&&wide);
    rotate.classList.toggle('show',platform==='mobile'&&active&&!wide);
    if(platform!=='mobile'||!active||!wide)resetJoystick();
    if(isStandalone())pwaGuide.classList.remove('show');
    syncSoloControls();
  }

  continueBtn.addEventListener('click',()=>{
    if(!platform){
      platformError.textContent='Lütfen önce BİLGİSAYAR veya TELEFON seç.';
      gate.querySelector('.platform-card')?.classList.add('nudge');
      setTimeout(()=>gate.querySelector('.platform-card')?.classList.remove('nudge'),320);
      return;
    }
    gate.classList.add('closing');
    setTimeout(()=>{gate.remove();syncPlatform();if(platform==='mobile')setTimeout(showPwaGuide,240);},180);
  });

  const game=document.getElementById('game');
  if(game)new MutationObserver(syncPlatform).observe(game,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',syncPlatform,{passive:true});
  addEventListener('orientationchange',()=>setTimeout(syncPlatform,150),{passive:true});
  addEventListener('blur',resetJoystick);
  document.addEventListener('visibilitychange',()=>document.hidden&&resetJoystick());
  document.addEventListener('contextmenu',event=>{if(platform==='mobile'&&gameActive())event.preventDefault();});
  document.addEventListener('touchmove',event=>{if(platform==='mobile'&&gameActive())event.preventDefault();},{passive:false});
  document.addEventListener('pointerdown',()=>{
    if(platform!=='mobile'||!gameActive())return;
    try{screen.orientation?.lock?.('landscape').catch(()=>{});}catch{}
  });

  if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
  syncPlatform();

  // Small pure-function hook used only by regression tests; it does not alter gameplay/networking.
  window.__KafaTopuMobile={interpretJoystick,isStandalone,isIOSSafari,JOY};
})();
