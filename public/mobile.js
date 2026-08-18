(()=>{
  const html=document.documentElement;
  let platform=null;
  const gameActive=()=>document.getElementById('game')?.classList.contains('active');
  const landscape=()=>innerWidth>innerHeight;

  // Platform selection is explicit on every fresh page load. It changes only the local control layer;
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

  const joystick=document.getElementById('mobileJoystick');
  const knob=document.getElementById('mobileJoystickKnob');
  const headerBtn=document.getElementById('mobileHeader');
  const specialBtn=document.getElementById('mobileSpecial');
  let activePointer=null;
  const setKey=(code,value)=>{ if(typeof keys!=='undefined') keys[code]=value; };

  function resetJoystick(){
    activePointer=null;
    ['KeyA','KeyD','KeyW','KeyS'].forEach(k=>setKey(k,false));
    knob.style.transform='translate3d(0,0,0)';
    joystick.classList.remove('active');
  }
  function updateJoystick(clientX,clientY){
    const rect=joystick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    let dx=clientX-cx,dy=clientY-cy;
    const max=rect.width*.31,length=Math.hypot(dx,dy)||1;
    if(length>max){dx=dx/length*max;dy=dy/length*max;}
    knob.style.transform=`translate3d(${dx}px,${dy}px,0)`;
    const nx=dx/max,ny=dy/max,dead=.24;
    setKey('KeyA',nx<-dead); setKey('KeyD',nx>dead); setKey('KeyW',ny<-.40); setKey('KeyS',ny>.58);
  }
  joystick.addEventListener('pointerdown',event=>{
    if(platform!=='mobile'||!gameActive())return;
    event.preventDefault(); activePointer=event.pointerId; joystick.setPointerCapture?.(event.pointerId);
    joystick.classList.add('active'); updateJoystick(event.clientX,event.clientY);
  });
  joystick.addEventListener('pointermove',event=>{
    if(event.pointerId!==activePointer)return; event.preventDefault(); updateJoystick(event.clientX,event.clientY);
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>joystick.addEventListener(type,event=>{
    if(activePointer!==null&&event.pointerId!==undefined&&event.pointerId!==activePointer)return; resetJoystick();
  }));
  function actionButton(button,type){
    button.addEventListener('pointerdown',event=>{
      if(platform!=='mobile'||!gameActive())return;
      event.preventDefault(); button.classList.add('pressed');
      if(typeof socket!=='undefined') socket.emit('action',{type});
      navigator.vibrate?.(12);
    });
    ['pointerup','pointercancel','pointerleave'].forEach(t=>button.addEventListener(t,event=>{event.preventDefault();button.classList.remove('pressed');}));
  }
  actionButton(headerBtn,'header'); actionButton(specialBtn,'special');

  function syncPlatform(){
    html.classList.toggle('platform-mobile',platform==='mobile');
    html.classList.toggle('platform-desktop',platform==='desktop');
    const active=gameActive();
    const wide=landscape();
    controls.classList.toggle('show',platform==='mobile'&&active&&wide);
    rotate.classList.toggle('show',platform==='mobile'&&active&&!wide);
    if(platform!=='mobile'||!active||!wide)resetJoystick();
  }

  continueBtn.addEventListener('click',()=>{
    if(!platform){
      platformError.textContent='Lütfen önce BİLGİSAYAR veya TELEFON seç.';
      gate.querySelector('.platform-card')?.classList.add('nudge');
      setTimeout(()=>gate.querySelector('.platform-card')?.classList.remove('nudge'),320);
      return;
    }
    gate.classList.add('closing');
    setTimeout(()=>{gate.remove();syncPlatform();},180);
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
})();
