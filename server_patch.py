from pathlib import Path
import sys

p=Path(sys.argv[1] if len(sys.argv)>1 else 'server.js')
s=p.read_text(encoding='utf-8')
original=s

def replace_once(old,new,label):
    global s
    if new in s:
        return
    count=s.count(old)
    if count!=1:
        raise SystemExit(f'HATA: {label} için beklenen kod bulunamadı (adet={count}). Güncel server.js ile uyum kontrolü gerekli.')
    s=s.replace(old,new,1)

# Room flag; false by default and reset on every fresh/restarted single-player match.
replace_once(
    'winner:null,shake:0,emptySince:null,lastKickoffSide:0,kickoffStreak:0};',
    'winner:null,shake:0,userPaused:false,emptySince:null,lastKickoffSide:0,kickoffStreak:0};',
    'userPaused oda alanı'
)
replace_once(
    'function startMatch(room){fillCpuSelections(room);room.phase="intro";room.score=[0,0];',
    'function startMatch(room){fillCpuSelections(room);room.userPaused=false;room.phase="intro";room.score=[0,0];',
    'startMatch pause reset'
)

# Authoritative single-player-only pause/restart socket handlers.
anchor='  socket.on("returnLobby",()=>{const room=rooms.get(socket.data.room);if(room&&(room.hostId===socket.id||room.phase==="matchOver")){room.phase="lobby";room.winner=null;if(room.playMode==="single")room.stage=Math.floor(Math.random()*STAGE_COUNT);clearReady(room);emitLobby(room);}});\n'
handlers='''  socket.on("toggleSoloPause",(_payload,reply=()=>{})=>{const room=rooms.get(socket.data.room);if(!room||room.playMode!=="single")return reply({ok:false,error:"Duraklatma yalnızca tek oyunculu modda kullanılabilir."});if(!["playing","goalPause"].includes(room.phase))return reply({ok:false,error:"Maç şu anda duraklatılamaz."});room.userPaused=!room.userPaused;io.to(room.code).emit("soloPause",{paused:room.userPaused});reply({ok:true,paused:room.userPaused});});
  socket.on("restartSoloMatch",(_payload,reply=()=>{})=>{const room=rooms.get(socket.data.room);if(!room||room.playMode!=="single")return reply({ok:false,error:"Maç yeniden başlatma yalnızca tek oyunculu modda kullanılabilir."});if(!["playing","goalPause","matchOver"].includes(room.phase))return reply({ok:false,error:"Maç şu anda yeniden başlatılamaz."});room.userPaused=false;room.score=[0,0];room.timer=room.rules.duration;room.overtime=false;room.pause=0;room.kickoff=1.15;room.winner=null;room.shake=0;room.phase="playing";room.players=activeSlots(room).map((slot)=>createPlayer(slot,room.selections[slot],room.worldWidth));room.ball=createBall(room.ballType,nextKickoffX(room));for(const id of room.inputs.keys())room.inputs.set(id,{});const next=publicState(room);io.to(room.code).emit("soloRestarted",next);io.to(room.code).emit("state",next);emitLobby(room);reply({ok:true});});
'''
if 'socket.on("toggleSoloPause"' not in s:
    if anchor not in s: raise SystemExit('HATA: single-player kontrol handler konumu bulunamadı.')
    s=s.replace(anchor,anchor+handlers,1)

# Pause blocks physics/timer entirely and is exposed in state.
replace_once(
    'function update(room){\n  if(room.phase==="intro")',
    'function update(room){\n  if(room.userPaused)return;\n  if(room.phase==="intro")',
    'update pause guard'
)
replace_once(
    'function publicState(room){return{phase:room.phase,format:room.format,',
    'function publicState(room){return{phase:room.phase,paused:!!room.userPaused,format:room.format,',
    'publicState paused alanı'
)

# Prevent action/dash mutations while the authoritative single-player state is paused.
replace_once(
    'function startAction(room,player,type){\n  if(room.phase!=="playing"||room.kickoff>0||!canAct(player))return false;',
    'function startAction(room,player,type){\n  if(room.userPaused||room.phase!=="playing"||room.kickoff>0||!canAct(player))return false;',
    'paused startAction guard'
)
replace_once(
    'function startDash(room,player,direction){if(room.phase!=="playing"||room.kickoff>0||!canAct(player)||player.dashCooldown>0)return false;',
    'function startDash(room,player,direction){if(room.userPaused||room.phase!=="playing"||room.kickoff>0||!canAct(player)||player.dashCooldown>0)return false;',
    'paused startDash guard'
)

if s!=original:
    p.write_text(s,encoding='utf-8')
