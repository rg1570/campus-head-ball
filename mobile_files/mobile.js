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
    <span class="platform-kicker">IPHONE • TAM EKRAN</span>
    <h2 id="pwaGuideTitle">Kafa Topu'nu Tam Ekran Oyna</h2>
    <p>En iyi oyun deneyimi için Kafa Topu'nu ana ekranına ekle. Bundan sonra oyun uygulama gibi ayrı pencerede açılır.</p>
    <div class="pwa-path"><b>Paylaş</b><i>→</i><b>Ana Ekrana Ekle</b><i>→</i><b>Web Uygulaması Olarak Aç</b><i>→</i><b>Ekle</b></div>
    <div class="pwa-actions"><button id="pwaUnderstood" type="button" class="pwa-primary">ANLADIM</button><button id="pwaLater" type="button" class="pwa-secondary">ŞİMDİ DEĞİL</button><button id="browserFullscreen" type="button" class="pwa-fullscreen hidden">⛶ TAM EKRAN</button></div>
  </section>`;
  document.body.appendChild(pwaGuide);

  const joystick=document.getElementById('mobileJoystick');
  const knob=document.getElementById('mobileJoystickKnob');
  const headerBtn=document.getElementById('mobileHeader');
  const specialBtn=document.getElementById('mobileSpecial');
  const fullscreenBtn=document.getElementById('browserFullscreen');
  let activePointer=null;
  const setKey=(code,value)=>{ if(typeof keys!=='undefined') keys[code]=value; };

  // Analog interpretation constants. Horizontal movement intentionally has generous vertical tolerance.
  // Crouch has a narrower downward cone and a larger magnitude threshold to avoid accidental crouches.
  const JOY={dead:0.18,horizontal:0.23,jumpY:-0.38,jumpMagnitude:0.40,crouchY:0.72,crouchMagnitude:0.76,crouchDominance:1.45};
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
    ['KeyA','KeyD','KeyW','KeyS'].forEach(k=>setKey(k,false));
    knob.style.transform='translate3d(0,0,0)';
    joystick.classList.remove('active');
  }
  function updateJoystick(clientX,clientY){
    const rect=joystick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const rawX=clientX-cx,rawY=clientY-cy;
    const max=rect.width*.31,rawLength=Math.hypot(rawX,rawY)||1;
    const magnitude=Math.min(1,rawLength/max);
    let dx=rawX,dy=rawY;
    if(rawLength>max){dx=rawX/rawLength*max;dy=rawY/rawLength*max;}
    knob.style.transform=`translate3d(${dx}px,${dy}px,0)`;
    const nx=dx/max,ny=dy/max;
    const intent=interpretJoystick(nx,ny,magnitude);
    setKey('KeyA',intent.left);setKey('KeyD',intent.right);setKey('KeyW',intent.jump);setKey('KeyS',intent.down);
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

  function shouldShowPwaGuide(){
    if(platform!=='mobile'||!isIOSSafari()||isStandalone())return false;
    if(localStorage.getItem('kafatopu-pwa-understood')==='1')return false;
    const later=Number(localStorage.getItem('kafatopu-pwa-later')||0);
    return !later||Date.now()-later>3*24*60*60*1000;
  }
  function showPwaGuide(){if(shouldShowPwaGuide())pwaGuide.classList.add('show');}
  function closePwaGuide(mode){
    if(mode==='understood')localStorage.setItem('kafatopu-pwa-understood','1');
    if(mode==='later')localStorage.setItem('kafatopu-pwa-later',String(Date.now()));
    pwaGuide.classList.remove('show');
  }
  document.getElementById('pwaUnderstood').addEventListener('click',()=>closePwaGuide('understood'));
  document.getElementById('pwaLater').addEventListener('click',()=>closePwaGuide('later'));
  pwaGuide.addEventListener('pointerdown',event=>{if(event.target===pwaGuide)closePwaGuide('later');});

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
