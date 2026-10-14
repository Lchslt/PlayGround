import * as THREE from 'three';
import { MONSTERS, MOVES, WILD_TABLES, TRAINERS, GYM, RIVAL_TEAM_1, RIVAL_TEAM_2, effectiveness } from './data.js';
import { buildWorld, WORLD, collide, isGrass, zoneAt } from './world.js';
import { buildMonster, animateMonster } from './monsters3d.js';
import { makeMon, calcDamage, gainXp, catchChance } from './battle.js';
import { sfx } from './audio.js';

const $=id=>document.getElementById(id);
const canvas=$("scene");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(2,devicePixelRatio));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,0.1,400);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

buildWorld(scene);

// --- Joueur chibi style Let's Go ---
function buildPlayer(){
  const g=new THREE.Group();
  const jacket=new THREE.MeshStandardMaterial({color:0xffd83d,roughness:0.7});
  const skin=new THREE.MeshStandardMaterial({color:0xffd9b3,roughness:0.7});
  const pants=new THREE.MeshStandardMaterial({color:0x2c3e50,roughness:0.8});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.38,0.7,6,12),jacket);body.position.y=1;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.36,18,14),skin);head.position.y=1.95;head.castShadow=true;g.add(head);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.38,0.2,14),new THREE.MeshStandardMaterial({color:0xe63c2e}));cap.position.y=2.25;g.add(cap);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.08,0.4),new THREE.MeshStandardMaterial({color:0xe63c2e}));visor.position.set(0,2.18,0.4);g.add(visor);
  for(const s of [-1,1]){
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(0.12,0.5,4,8),jacket);arm.position.set(s*0.5,1.1,0);g.add(arm);
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(0.14,0.5,4,8),pants);leg.position.set(s*0.2,0.35,0);g.add(leg);leg.name="leg"+s;
  }
  const eyeM=new THREE.MeshStandardMaterial({color:0x111111});
  for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(0.06,8,8),eyeM);e.position.set(s*0.13,2.0,0.32);g.add(e);}
  return g;
}
const player=buildPlayer(); scene.add(player);
const state={
  started:false, x:0,z:56, dir:Math.PI, speed:9,
  team:[], box:[], orbs:5, potions:3, money:300,
  dex:new Set(), badges:[], flags:{}, repel:0,
  quest:"Parle au Prof. Odo au labo !",
  inBattle:false, inDialog:false, menuOpen:false,
  rivalBeaten1:false, gymDone:false,
};
let follower=null;
function setFollower(species){
  if(follower){scene.remove(follower);}
  if(!species) return;
  follower=buildMonster(species);
  follower.scale.setScalar(0.7);
  scene.add(follower);
}
window.__state=state;

// Caméra 3e personne
let camYaw=Math.PI, camDist=9, camH=5.5, dragging=false,px=0;
canvas.addEventListener("pointerdown",e=>{dragging=true;px=e.clientX;});
addEventListener("pointerup",()=>dragging=false);
addEventListener("pointermove",e=>{if(dragging){camYaw-=(e.clientX-px)*0.005;px=e.clientX;}});
addEventListener("wheel",e=>{camDist=Math.min(18,Math.max(5,camDist+e.deltaY*0.01));},{passive:true});
const keys={};
addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  keys[k]=true;
  if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
  if(k==="e"||k===" "){ interact(); advanceDialog(); }
  if(k==="m"){ toggleMenu(); }
  if(k==="escape"){ closeAll(); }
});
addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false;});
$("dialog").addEventListener("click",()=>advanceDialog());

// --- Dialogues ---
let dlgQueue=[],dlgName="";
function say(name,texts){ dlgName=name; dlgQueue=[...texts]; state.inDialog=true; $("dialog").classList.remove("hidden"); nextDlg(); sfx.talk(); }
function nextDlg(){
  if(!dlgQueue.length){ $("dialog").classList.add("hidden"); state.inDialog=false; onDialogEnd(); return; }
  $("dlgName").textContent=dlgName; $("dlgText").textContent=dlgQueue.shift();
}
function advanceDialog(){ if(state.inDialog) nextDlg(); }
let afterDialog=null;
function onDialogEnd(){ if(afterDialog){const f=afterDialog;afterDialog=null;f();} }

// --- HUD ---
function toast(t){ const el=$("toast"); el.textContent=t; el.classList.remove("hidden"); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.add("hidden"),2600); }
function setQuest(t){ state.quest=t; $("quest").textContent="🎒 "+t; }
function refreshParty(){
  $("partyMini").innerHTML=state.team.map(m=>`<div class="mini"><b>${MONSTERS[m.species].name}</b>Nv ${m.level}<br/>${m.hp}/${m.maxhp} PV${m.hp<=m.maxhp*0.25?' <span class="low">!</span>':''}</div>`).join("");
  $("orbCount").textContent="×"+state.orbs;
  $("bagCount").textContent=`• ${state.orbs} orbes • ${state.potions} potions • ${state.money}₽`;
}
function save(){ try{localStorage.setItem("jaune3d",JSON.stringify({team:state.team,box:state.box,orbs:state.orbs,potions:state.potions,money:state.money,dex:[...state.dex],badges:state.badges,flags:state.flags,x:state.x,z:state.z,quest:state.quest}));toast("💾 Partie sauvegardée !");}catch(e){} }
function load(){
  try{const s=JSON.parse(localStorage.getItem("jaune3d"));if(!s||!s.team?.length) return false;
    Object.assign(state,{team:s.team,box:s.box||[],orbs:s.orbs,potions:s.potions,money:s.money,badges:s.badges||[],flags:s.flags||[],x:s.x,z:s.z});state.dex=new Set(s.dex||[]);setQuest(s.quest||"Explore !");setFollower(state.team[0]?.species);return true;}catch(e){return false;}
}

// --- Interactions ---
function nearestInteractable(){
  let best=null,bd=1e9;
  for(const n of WORLD.npcs){const d=Math.hypot(n.x-state.x,n.z-state.z);if(d<3.6&&d<bd){bd=d;best={kind:"npc",o:n};}}
  for(const s of WORLD.signs){const d=Math.hypot(s.x-state.x,s.z-state.z);if(d<s.range&&d<bd){bd=d;best={kind:"sign",o:s};}}
  for(const d of WORLD.doors){const dd=Math.hypot(d.x-state.x,d.z-state.z);if(dd<4&&d<bd){bd=dd;best={kind:"door",o:d};}}
  return best;
}
function interact(){
  if(!state.started||state.inBattle||state.menuOpen) return;
  // starter bloqué au labo
  const t=nearestInteractable();
  if(!t) return;
  sfx.select();
  if(t.kind==="sign"){ say("Panneau",[t.o.text]); return; }
  if(t.kind==="door"){
    if(t.o.label==="center"){ healParty(); return; }
    if(t.o.label==="shop"){ say("Boutique",t.o.used?["Reviens quand tu auras le Badge Roche !"]:["Bienvenue ! Voici 3 Orbes offertes pour débuter !"]); if(!t.o.used){t.o.used=true;state.orbs+=3;state.potions+=1;refreshParty();} return; }
    if(t.o.label==="gym"){ tryGym(); return; }
  }
  const n=t.o;
  if(n.name==="Prof. Odo"){
    if(!state.team.length){ showStarter(); }
    else say("Prof. Odo",["Ton Voltik a l'air heureux ! Il te suit comme dans la légende Jaune.","Cap au nord : traverse la Route 1, défie la Cité Azur et son Arène Roche !"]);
  } else if(n.name==="Rival Niko"){
    if(state.team.length&&!state.rivalBeaten1){ say("Rival Niko",["Niko : Mon Nébouli et moi, on s'est entraînés !","Bats-toi !"]); afterDialog=()=>startBattle({type:"rival1",team:RIVAL_TEAM_1.map(([s,l])=>makeMon(s,l)),name:"Rival Niko",reward:180}); }
    else if(!state.rivalBeaten1){ say("Rival Niko",["D'abord va voir le Prof. Odo au labo !"]); }
    else say("Rival Niko",["T'es fort... La prochaine fois je gagne ! On se revoit à la Cité Azur."]);
  } else if(n.team&&!n.beaten){
    say(n.name,[n.text,"Combat !"]); afterDialog=()=>startBattle({type:"trainer",team:n.team.map(([s,l])=>makeMon(s,l)),name:n.name,reward:n.reward,npc:n});
  } else if(n.team&&n.beaten){ say(n.name,["Bien joué... Je dois encore m'entraîner."]); }
  else if(n.name==="Championne Lina"){ tryGym(); }
  else if(n.name==="Infirmière Joëlle"){ healParty(); }
  else say(n.name,[n.text]);
}
function healParty(){ state.team.forEach(m=>{m.hp=m.maxhp;m.status=null;}); sfx.heal(); refreshParty(); say("Centre Monstres",["Tes monstres sont en pleine forme ! 💚"]); }
function showStarter(){ $("starterPick").classList.remove("hidden"); }
$("pickVoltik").addEventListener("click",()=>{
  $("starterPick").classList.add("hidden");
  const v=makeMon("voltik",5); state.team=[v]; state.dex.add("voltik"); state.orbs=5;
  setFollower("voltik"); refreshParty(); sfx.caught();
  say("Prof. Odo",["Tu as reçu VOLTIK, la Souris Volt !","Comme dans Jaune, il refusera sa Boîte et te suivra partout.","Direction la Route 1 vers le nord ! Bats ton rival Niko !"]);
  setQuest("Affronte ton rival Niko près du labo, puis va au nord !");
  save();
});

// --- Menu / Dex ---
function toggleMenu(force){
  state.menuOpen=force??!state.menuOpen;
  $("menu").classList.toggle("hidden",!state.menuOpen);
  if(state.menuOpen){ renderMenu(); sfx.select(); }
}
function renderMenu(){
  $("menuTeam").innerHTML=state.team.map((m,i)=>`<div class="mrow">${i===0?"⭐":""} <b>${MONSTERS[m.species].name}</b> Nv${m.level} • ${m.hp}/${m.maxhp} PV • ${MONSTERS[m.species].types.join("/")} ${state.team.length>1?`<button data-sw="${i}">1er</button>`:""}</div>`).join("")+`<div class="mrow">🎖️ Badges : ${state.badges.join(", ")||"aucun"} • 💰 ${state.money}₽</div>`;
  $("menuTeam").querySelectorAll("[data-sw]").forEach(b=>b.onclick=()=>{const i=+b.dataset.sw;const[t]=state.team.splice(i,1);state.team.unshift(t);setFollower(state.team[0].species);renderMenu();refreshParty();});
  $("bagInfo").innerHTML=`Orbes : <b>${state.orbs}</b> • Potions : <b>${state.potions}</b> <button id="usePot">Utiliser potion (+40PV au 1er)</button>`;
  $("usePot").onclick=()=>{ if(state.potions>0&&state.team[0]&&state.team[0].hp<state.team[0].maxhp){state.potions--;state.team[0].hp=Math.min(state.team[0].maxhp,state.team[0].hp+40);sfx.heal();renderMenu();refreshParty();} };
}
$("btnCloseMenu").onclick=()=>toggleMenu(false);
$("btnSave").onclick=save;
$("btnHeal").onclick=()=>{healParty();renderMenu();};
$("btnBag").onclick=()=>{toast(`🎒 ${state.orbs} Orbes • ${state.potions} Potions • ${state.money}₽`);};
$("btnDex").onclick=()=>{renderDex();$("dex").classList.remove("hidden");};
$("btnCloseDex").onclick=()=>$("dex").classList.add("hidden");
function renderDex(){
  $("dexGrid").innerHTML=Object.entries(MONSTERS).map(([id,d])=>`<div class="dexcard ${state.dex.has(id)?'seen':''}"><b>${state.dex.has(id)?d.name:"???"}</b><br/>${state.dex.has(id)?d.types.join(" / ")+"<br/>"+d.desc:"Pas encore vu."}</div>`).join("");
}
function closeAll(){ toggleMenu(false); $("dex").classList.add("hidden"); }

// --- Arène ---
function tryGym(){
  if(!state.team.length){ say("Lina",["Reviens avec un monstre !"]); return; }
  if(state.gymDone){ say("Championne Lina",["Tu as déjà mon Badge Roche. Respect !"]); return; }
  say("Championne Lina",["Bienvenue dans l'Arène Roche ! Moi c'est Lina.","Mes Caillou et Grolive vont t'écraser !","Règle : 2 contre 2. Que le meilleur gagne !"]);
  afterDialog=()=>startBattle({type:"gym",team:GYM.team.map(([s,l])=>makeMon(s,l)),name:GYM.name,reward:GYM.reward});
}

// ================= COMBAT =================
let B=null; // {foe team, ally idx, foeIdx, kind, ...}
let battleMeshes={};
function firstAlive(team){ return team.findIndex(m=>m.hp>0); }
function startBattle(cfg){
  state.inBattle=true; B={...cfg,foeIdx:0,allyIdx:firstAlive(state.team),msgQ:[]};
  if(B.allyIdx<0){ toast("Tous tes monstres sont K.O. ! Va au Centre !"); state.inBattle=false; return; }
  sfx.encounter();
  setupBattleScene();
  $("battle").classList.remove("hidden");
  $("moveBtns").classList.add("hidden");$("teamBtns").classList.add("hidden");$("battleBtns").classList.remove("hidden");
  bmsg(`${cfg.type==="wild"?"Un "+MONSTERS[cfg.team[0].species].name+" sauvage apparaît !":cfg.name+" veut se battre !"}`);
  state.dex.add(B.team[0].species);
  setTimeout(()=>{ bmsg(`En avant, ${MONSTERS[state.team[B.allyIdx].species].name} !`); refreshBattleUI(); },1400);
  refreshParty();
}
function activeAlly(){ return state.team[B.allyIdx]; }
function activeFoe(){ return B.team[B.foeIdx]; }
function bmsg(t){ $("battleMsg").textContent=t; }
function refreshBattleUI(){
  const a=activeAlly(),f=activeFoe();
  if(!a||!f) return;
  $("foeName").textContent=(B.type==="wild"?"Sauvage ":"")+MONSTERS[f.species].name;
  $("foeLvl").textContent="Nv"+f.level;
  $("foeHp").style.width=(100*f.hp/f.maxhp)+"%";$("foeHp").className=f.hp<f.maxhp*0.25?"low":"";
  $("foeHpTxt").textContent=`${Math.max(0,f.hp)}/${f.maxhp} PV`;
  $("teamName").textContent=MONSTERS[a.species].name;
  $("teamLvl").textContent="Nv"+a.level;
  $("teamHp").style.width=(100*a.hp/a.maxhp)+"%";$("teamHp").className=a.hp<a.maxhp*0.25?"low":"";
  $("teamHpTxt").textContent=`${Math.max(0,a.hp)}/${a.maxhp} PV`;
  const need=(a.level+1)*(a.level+1)*10, prev=a.level*a.level*10;
  $("teamXpFill").style.width=Math.min(100,100*(a.xp-prev)/(need-prev))+"%";
  $("orbCount").textContent="×"+state.orbs;
  refreshParty();
}
$("battleBtns").addEventListener("click",e=>{
  const act=e.target.closest("button")?.dataset.act; if(!act||!B||B.busy) return;
  sfx.select();
  if(act==="fight"){
    const a=activeAlly();
    $("moveBtns").innerHTML=a.moves.map(mv=>`<button data-mv="${mv}">${MOVES[mv].name}<br/><small>${MOVES[mv].type} • ${MOVES[mv].power||"—"}</small></button>`).join("");
    $("moveBtns").classList.remove("hidden");
  } else if(act==="orb"){ tryCapture(); }
  else if(act==="team"){
    $("teamBtns").innerHTML=state.team.map((m,i)=>`<button data-i="${i}" ${m.hp<=0?"disabled":""}>${MONSTERS[m.species].name} Nv${m.level} ${m.hp}/${m.maxhp}</button>`).join("");
    $("teamBtns").classList.remove("hidden");
  } else if(act==="flee"){ tryFlee(); }
});
$("moveBtns").addEventListener("click",e=>{
  const mv=e.target.closest("button")?.dataset.mv; if(!mv||!B||B.busy) return;
  $("moveBtns").classList.add("hidden"); doTurn(mv);
});
$("teamBtns").addEventListener("click",e=>{
  const i=e.target.closest("button")?.dataset.i; if(i===undefined||!B) return;
  const idx=+i; if(state.team[idx].hp<=0) return;
  if(B.mustSwap){
    B.mustSwap=false; B.allyIdx=idx; B.busy=false;
    $("teamBtns").classList.add("hidden");
    swapAllyMesh(); refreshBattleUI(); bmsg(`En avant, ${MONSTERS[activeAlly().species].name} !`);
    setTimeout(()=>foeStrike(),800);
    return;
  }
  if(B.busy) return;
  if(idx===B.allyIdx) return;
  $("teamBtns").classList.add("hidden"); B.busy=true;
  bmsg(`Reviens, ${MONSTERS[activeAlly().species].name} ! En avant, ${MONSTERS[state.team[idx].species].name} !`);
  B.allyIdx=idx; sfx.select(); swapAllyMesh();
  setTimeout(()=>{ B.busy=false; foeStrike(); },900);
});
function foeStrike(cb){
  if(!B||B.over) return;
  const f=activeFoe(),a=activeAlly();
  if(f.hp<=0||a.hp<=0){cb?.();return;}
  B.busy=true;
  const mv=f.moves[Math.floor(Math.random()*f.moves.length)];
  setTimeout(()=>{ execMove(f,a,mv,true); refreshBattleUI();
    setTimeout(()=>{ B.busy=false; checkEnd()||cb?.(); },800);
  },500);
}
async function doTurn(moveId){
  B.busy=true;
  const a=activeAlly(),f=activeFoe();
  const foeMove=f.moves[Math.floor(Math.random()*f.moves.length)];
  const aFirst=(MOVES[moveId].prio||0)>(MOVES[foeMove].prio||0)||((MOVES[moveId].prio||0)===(MOVES[foeMove].prio||0)&&a.spd>=f.spd);
  const order=aFirst?[[a,f,moveId,false],[f,a,foeMove,true]]:[[f,a,foeMove,true],[a,f,moveId,false]];
  for(const [att,def,mv,isFoe] of order){
    if(att.hp<=0||def.hp<=0) continue;
    if(B.over) break;
    execMove(att,def,mv,isFoe); refreshBattleUI();
    attackAnim(isFoe?battleMeshes.foe:battleMeshes.ally, !isFoe?battleMeshes.foe:battleMeshes.ally, MOVES[mv].type);
    await wait(950);
    if(checkEnd()) break;
  }
  if(!B?.over) B.busy=false;
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function execMove(att,def,moveId,isFoe){
  const mv=MOVES[moveId];
  const who=MONSTERS[att.species].name;
  if(mv.effect==="atk-down"){ def.atk=Math.max(1,def.atk-2); bmsg(`${who} lance ${mv.name} ! L'Attaque adverse baisse !`); sfx.weak(); return; }
  if(Math.random()*100>mv.acc){ bmsg(`${who} lance ${mv.name}... mais ça rate !`); return; }
  const {dmg,eff}=calcDamage(att,def,moveId);
  def.hp=Math.max(0,def.hp-dmg);
  let txt=`${who} lance ${mv.name} ! -${dmg} PV`;
  if(eff>1){txt+=" C'est super efficace !";sfx.super();} else if(eff<1&&eff>0){txt+=" C'est peu efficace...";sfx.weak();} else if(eff===0){txt+=" Ça n'affecte pas l'ennemi...";}
  else sfx.attack();
  if(mv===MOVES.etincelle&&Math.random()<0.3&&def.hp>0){def.status="par";txt+=" Paralysé !";}
  bmsg(txt);
}
function checkEnd(){
  const a=activeAlly(),f=activeFoe();
  if(f.hp<=0){
    B.busy=true;
    bmsg(`L'adversaire ${MONSTERS[f.species].name} est K.O. !`);
    sfx.hit();
    const gain=Math.floor(f.level*12+(B.type!=="wild"?30:0));
    const logs=[]; gainXp(a,gain,t=>logs.push(t));
    setTimeout(()=>{
      if(!B) return;
      if(logs.length) bmsg(`+${gain} XP ! `+logs.join(" "));
      else bmsg(`+${gain} XP !`);
      refreshBattleUI(); refreshParty();
      setTimeout(()=>{
        if(!B||B.over) return;
        B.foeIdx++;
        if(B.foeIdx<B.team.length){ bmsg(`${B.name} envoie ${MONSTERS[activeFoe().species].name} !`); swapFoeMesh(); state.dex.add(activeFoe().species); refreshBattleUI(); B.busy=false; }
        else winBattle();
      },1300);
    },900);
    return true;
  }
  if(a.hp<=0){
    const nx=state.team.findIndex((m,i)=>i!==B.allyIdx&&m.hp>0);
    if(nx<0){ loseBattle(); return true; }
    bmsg(`${MONSTERS[a.species].name} est K.O. ! Choisis un remplaçant.`);
    $("teamBtns").innerHTML=state.team.map((m,i)=>`<button data-i="${i}" ${m.hp<=0?"disabled":""}>${MONSTERS[m.species].name} Nv${m.level}</button>`).join("");
    $("teamBtns").classList.remove("hidden");
    B.busy=true; B.mustSwap=true;
    return true;
  }
  return false;
}
function tryCapture(){
  if(B.type!=="wild"){ bmsg("Impossible de capturer le monstre d'un dresseur !"); return; }
  if(state.orbs<=0){ bmsg("Plus d'Orbes ! Va à la Boutique (Cité Azur)."); return; }
  state.orbs--; refreshBattleUI();
  sfx.capture(); orbAnim();
  const f=activeFoe();
  const p=catchChance(f);
  bmsg(`Tu lances une Orbe... (${Math.round(p*100)}%)`);
  setTimeout(()=>{
    if(Math.random()<p){
      sfx.caught();
      const nm=makeMon(f.species,f.level);
      state.team.length<6?state.team.push(nm):state.box.push(nm);
      state.dex.add(f.species);
      bmsg(`🎉 ${MONSTERS[f.species].name} capturé ! Il rejoint ${state.team.length<=6?"ton équipe":"ta boîte"}.`);
      refreshParty();
      setTimeout(()=>endBattle(true),1600);
    } else {
      bmsg("Raté ! Le monstre s'est libéré !");
      setTimeout(()=>foeStrike(),900);
    }
  },1100);
}
function tryFlee(){
  if(B.type==="gym"||B.type==="rival1"||B.type==="rival2"){ bmsg("Impossible de fuir ce combat !"); return; }
  const a=activeAlly(),f=activeFoe();
  if(Math.random()<0.7||a.spd>=f.spd){ sfx.flee(); bmsg("Tu prends la fuite !"); setTimeout(()=>endBattle(false),800); }
  else { bmsg("Fuite impossible !"); setTimeout(()=>foeStrike(),800); }
}
function winBattle(){
  const r=B.reward||100; state.money+=r;
  let extra="";
  if(B.type==="rival1"){ state.rivalBeaten1=true; setQuest(" Traverse la Route 1 vers la CITÉ AZUR au nord !"); extra=" Niko : ...Fort. Je m'entraîne et je reviens !"; }
  if(B.type==="gym"){ state.gymDone=true; state.badges.push("Roche"); state.money+=200; sfx.badge(); extra=` 🏅 Tu reçois le ${GYM.badge} ! +3 Orbes !`; state.orbs+=3;
    setQuest("CHAMPION ! Explore la forêt et la grotte pour compléter ton Monstédex (18 espèces)."); }
  if(B.npc) B.npc.beaten=true;
  bmsg(`🏆 Victoire contre ${B.name} ! +${r}₽ !${extra}`);
  refreshParty();
  setTimeout(()=>endBattle(true),2200);
}
function loseBattle(){
  bmsg("Tes monstres sont K.O... Tu cours au Centre Monstres !");
  setTimeout(()=>{
    state.x=-12;state.z=-26; state.team.forEach(m=>m.hp=m.maxhp);
    refreshParty(); endBattle(false); healParty();
    setQuest(state.gymDone?"Complète ton Monstédex !":"Direction l'Arène de la Cité Azur !");
  },1800);
}
function endBattle(win){
  B.over=true; B=null;
  cleanupBattleScene();
  $("battle").classList.add("hidden");
  state.inBattle=false; save();
  if(win) toast("🏆 Combat gagné !");
}

// --- Mise en scène combat 3D ---
let battleGroup=null, savedCam=null;
function setupBattleScene(){
  cleanupBattleScene();
  savedCam={yaw:camYaw,dist:camDist,h:camH,x:state.x,z:state.z};
  battleGroup=new THREE.Group();
  const px=state.x, pz=state.z;
  // arène
  const ring=new THREE.Mesh(new THREE.CylinderGeometry(7,7.5,0.4,24),new THREE.MeshStandardMaterial({color:0xe8e0c8,roughness:0.9}));
  ring.position.set(px,0.2,pz);ring.receiveShadow=true;battleGroup.add(ring);
  const line=new THREE.Mesh(new THREE.TorusGeometry(6,0.15,8,32),new THREE.MeshStandardMaterial({color:0xe63c2e}));line.rotation.x=Math.PI/2;line.position.set(px,0.45,pz);battleGroup.add(line);
  const platA=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.2,0.5,16),new THREE.MeshStandardMaterial({color:0x4a90d9}));platA.position.set(px-3.5,0.5,pz+1);battleGroup.add(platA);
  const platF=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.2,0.5,16),new THREE.MeshStandardMaterial({color:0xe67e22}));platF.position.set(px+3.5,0.5,pz-2);battleGroup.add(platF);
  scene.add(battleGroup);
  const a=state.team[firstAlive(state.team)], f=B.team[0];
  const ma=buildMonster(a.species); ma.position.set(px-3.5,0.75,pz+1); ma.userData.baseY=0.75; battleGroup.add(ma); battleMeshes.ally=ma;
  const mf=buildMonster(f.species); mf.position.set(px+3.5,0.75,pz-2); mf.rotation.y=Math.PI; mf.userData.baseY=0.75; battleGroup.add(mf); battleMeshes.foe=mf;
  player.visible=false; if(follower) follower.visible=false;
}
function swapAllyMesh(){
  if(!battleGroup) return;
  battleGroup.remove(battleMeshes.ally);
  const px=state.x,pz=state.z;
  const ma=buildMonster(activeAlly().species);ma.position.set(px-3.5,0.75,pz+1);ma.userData.baseY=0.75;battleGroup.add(ma);battleMeshes.ally=ma;
}
function swapFoeMesh(){
  if(!battleGroup) return;
  battleGroup.remove(battleMeshes.foe);
  const px=state.x,pz=state.z;
  const mf=buildMonster(activeFoe().species);mf.position.set(px+3.5,0.75,pz-2);mf.rotation.y=Math.PI;mf.userData.baseY=0.75;battleGroup.add(mf);battleMeshes.foe=mf;
}
function cleanupBattleScene(){ if(battleGroup){scene.remove(battleGroup);battleGroup=null;} player.visible=true; if(follower) follower.visible=true; battleMeshes={}; }
let orbMesh=null;
function orbAnim(){
  orbMesh=new THREE.Mesh(new THREE.SphereGeometry(0.3,14,12),new THREE.MeshStandardMaterial({color:0xffd83d,emissive:0xffaa00,emissiveIntensity:0.6}));
  orbMesh.position.copy(battleMeshes.ally.position).add(new THREE.Vector3(0,1.5,0));
  scene.add(orbMesh);
  const target=battleMeshes.foe.position.clone();
  const t0=performance.now();
  (function step(){ if(!orbMesh) return; const t=(performance.now()-t0)/800;
    if(t>=1){scene.remove(orbMesh);orbMesh=null;return;}
    orbMesh.position.lerpVectors(battleMeshes.ally.position.clone().add(new THREE.Vector3(0,1.5,0)),target.clone().add(new THREE.Vector3(0,1,0)),t);
    orbMesh.rotation.y+=0.3; requestAnimationFrame(step); })();
}
let atkFx=[];
function attackAnim(src,dst,type){
  const colors={Electrik:0xffe93d,Feu:0xff5a2e,Eau:0x3db2ff,Plante:0x58e85d,Psy:0xff7fd4,Spectre:0x8a5cff,Roche:0xaaaaaa,Sol:0xc98a4b,Vol:0xbfe8ff,Insecte:0x7fe3a0,Normal:0xffffff,Dragon:0x5a7bff};
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.35,12,10),new THREE.MeshBasicMaterial({color:colors[type]??0xffffff,transparent:true,opacity:0.95}));
  m.position.copy(src.position).add(new THREE.Vector3(0,1.4,0)); scene.add(m);
  const from=m.position.clone(),to=dst.position.clone().add(new THREE.Vector3(0,1.2,0)); const t0=performance.now();
  sfx.attack();
  (function step(){ const t=(performance.now()-t0)/350; if(t>=1){ scene.remove(m);
      dst.position.x+=0.4; setTimeout(()=>{if(dst)dst.position.x-=0.4;},120); return; }
    m.position.lerpVectors(from,to,t); m.scale.setScalar(1+t*1.5); requestAnimationFrame(step); })();
}

// --- Boucle monde ---
const clock=new THREE.Clock();
let encounterCd=0, stepT=0;
function tick(){
  requestAnimationFrame(tick);
  const dt=Math.min(0.05,clock.getDelta()), t=clock.elapsedTime;
  // herbe qui ondule
  if(WORLD.grassMesh) WORLD.grassMesh.rotation.y=Math.sin(t*0.8)*0.01;
  // NPC idle
  for(const n of WORLD.npcs){ n.mesh.position.y=Math.abs(Math.sin(t*2+n.x))*0.06; n.mesh.rotation.y=Math.sin(t*0.7+n.z)*0.4; }
  if(battleMeshes.ally) animateMonster(battleMeshes.ally,t);
  if(battleMeshes.foe) animateMonster(battleMeshes.foe,t+2);
  if(follower&&!state.inBattle) animateMonster(follower,t+1);

  if(state.started&&!state.inBattle&&!state.inDialog){
    // mouvement
    let mx=0,mz=0;
    if(keys["z"]||keys["w"]||keys["arrowup"])mz-=1;
    if(keys["s"]||keys["arrowdown"])mz+=1;
    if(keys["q"]||keys["a"]||keys["arrowleft"])mx-=1;
    if(keys["d"]||keys["arrowright"])mx+=1;
    if(mx||mz){
      const len=Math.hypot(mx,mz);mx/=len;mz/=len;
      // relatif caméra
      const sin=Math.sin(camYaw),cos=Math.cos(camYaw);
      const wx=mx*cos-mz*sin, wz=-mx*sin-mz*cos;
      const nx=state.x+wx*state.speed*dt, nz=state.z+wz*state.speed*dt;
      const hasStarter=state.team.length>0;
      const col=collide(nx,nz,hasStarter);
      if(!col){ state.x=nx;state.z=nz; stepT+=dt;
        if(col===null&&false){}
      } else if(col.block==="no-starter"){ toast("⛔ Le Prof. Odo t'attend au labo d'abord !"); }
      else {
        // glisse
        if(!collide(nx,state.z,hasStarter)) state.x=nx;
        else if(!collide(state.x,nz,hasStarter)) state.z=nz;
      }
      state.dir=Math.atan2(wx,wz);
      player.position.y=Math.abs(Math.sin(stepT*10))*0.12;
      const legs=player.getObjectByName("leg1");if(legs)legs.rotation.x=Math.sin(stepT*10)*0.6;
      const leg2=player.getObjectByName("leg-1");if(leg2)leg2.rotation.x=-Math.sin(stepT*10)*0.6;
      // rencontres herbes
      encounterCd-=dt;
      if(isGrass(state.x,state.z)&&encounterCd<=0&&(mx||mz)){
        const zn=zoneAt(state.z);
        const table = zn==="route"?WILD_TABLES.route1:(state.z<-8?WILD_TABLES.foret:WILD_TABLES.route1);
        if(Math.random()<dt*0.55){
          encounterCd=4;
          const roll=Math.random()*100;let acc=0,pick=table[0];
          for(const e of table){acc+=e[3];if(roll<=acc){pick=e;break;}}
          const [sp,min,max]=pick; const lvl=min+Math.floor(Math.random()*(max-min+1));
          startBattle({type:"wild",team:[makeMon(sp,lvl)],name:"Sauvage",reward:Math.floor(lvl*8)});
        }
      }
      // dresseurs qui te voient
      for(const tr of WORLD.trainers){
        if(tr.beaten) continue;
        const d=Math.hypot(tr.x-state.x,tr.z-state.z);
        if(d<6&&Math.abs(tr.x-state.x)<4){
          tr.beaten="pending";
          say(tr.name,[tr.text,"Combat !"]); afterDialog=()=>{tr.beaten=false;startBattle({type:"trainer",team:tr.team.map(([s,l])=>makeMon(s,l)),name:tr.name,reward:tr.reward,npc:tr});};
          break;
        }
      }
      // rival zone cité (2e combat)
      if(state.rivalBeaten1&&!state.flags.rival2&&state.z<-10&&Math.hypot(state.x-4,state.z+12)<4){
        state.flags.rival2=true;
        say("Rival Niko",["Te voilà à la Cité Azur ! Mon équipe a grandi !","Revanche !"]); afterDialog=()=>startBattle({type:"rival2",team:RIVAL_TEAM_2.map(([s,l])=>makeMon(s,l)),name:"Rival Niko",reward:350});
      }
    }
    player.position.set(state.x,player.position.y,state.z);
    player.rotation.y=state.dir;
    // suiveur façon Pikachu Jaune
    if(follower){
      const tx=state.x-Math.sin(state.dir)*1.6, tz=state.z-Math.cos(state.dir)*1.6;
      follower.position.lerp(new THREE.Vector3(tx,follower.position.y,tz),Math.min(1,dt*4));
      follower.position.y=Math.abs(Math.sin(t*6))*0.15;
      follower.rotation.y=state.dir;
    }
    // hint
    const near=nearestInteractable();
    $("hint").style.display=near?"block":"none";
    if(near) $("hint").textContent="E : "+(near.kind==="npc"?("Parler à "+near.o.name):near.kind==="sign"?"Lire le panneau":"Entrer");
  }
  // caméra
  if(state.inBattle&&battleGroup){
    const px=state.x,pz=state.z;
    const cx=px+Math.sin(t*0.3)*2, cz=pz+10;
    camera.position.lerp(new THREE.Vector3(cx,7,cz),0.06);
    camera.lookAt(px,1.2,pz-0.5);
  } else {
    const cx=state.x+Math.sin(camYaw)*camDist, cz=state.z+Math.cos(camYaw)*camDist;
    camera.position.lerp(new THREE.Vector3(cx,camH,cz),0.12);
    camera.lookAt(state.x,1.6,state.z);
  }
  renderer.render(scene,camera);
}

// --- Démarrage ---
$("btnNew").onclick=()=>{
  localStorage.removeItem("jaune3d");
  state.team=[];state.box=[];state.orbs=5;state.potions=2;state.money=300;state.dex=new Set();state.badges=[];state.flags={};state.x=0;state.z=56;state.rivalBeaten1=false;state.gymDone=false;
  setFollower(null); begin();
  say("Prof. Odo",["Bienvenue à BOURG JAUNE ! Je suis le Prof. Odo.","Ce monde est peuplé de monstres originaux à apprivoiser.","Ton premier ami, VOLTIK, t'attend sur la table du labo. Va le chercher ! (marche avec ZQSD, E pour parler)"]);
  setQuest("Va au labo (maison verte) et parle au Prof. Odo !");
};
$("btnContinue").onclick=()=>{
  if(load()){ begin(); toast("Bon retour !"); }
  else toast("Aucune sauvegarde. Lance une nouvelle aventure !");
};
function begin(){
  state.started=true;
  $("title").classList.add("hidden");$("hud").classList.remove("hidden");$("loader").classList.add("hidden");
  player.position.set(state.x,0,state.z);
  refreshParty(); tickStarted();
}
let tickOn=false;
function tickStarted(){ if(!tickOn){tickOn=true;tick();} }
$("loader").classList.add("hidden");
refreshParty();
