import * as THREE from 'three';
import { MONSTERS } from './data.js';

function mat(c){ return new THREE.MeshStandardMaterial({color:c,roughness:0.7,metalness:0.05}); }
function ball(r,c){ const m=new THREE.Mesh(new THREE.SphereGeometry(r,18,14),mat(c)); m.castShadow=true; return m; }
function box(w,h,d,c){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c)); m.castShadow=true; return m; }
function cone(r,h,c){ const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,12),mat(c)); m.castShadow=true; return m; }

// Construit un monstre low-poly chibi style Let's Go (100% original)
export function buildMonster(speciesId){
  const def = MONSTERS[speciesId] || MONSTERS.ratibou;
  const g = new THREE.Group();
  const C = def.color;
  const dark = new THREE.Color(C).multiplyScalar(0.7).getHex();
  const light = new THREE.Color(C).lerp(new THREE.Color(0xffffff),0.4).getHex();
  const add=(m,x=0,y=0,z=0)=>{m.position.set(x,y,z);g.add(m);return m;};
  const eye=(x,y,z,s=0.09)=>{
    const e=ball(s,0xffffff); e.position.set(x,y,z); g.add(e);
    const p=ball(s*0.5,0x111111); p.position.set(x,y,z+s*0.7); g.add(p);
  };
  const S = def.shape;
  if(S==="mouse"||S==="mousebig"){
    const sc = S==="mousebig"?1.45:1;
    const body=add(ball(0.55*sc,C),0,0.6*sc,0);
    const head=add(ball(0.45*sc,light),0,1.25*sc,0.1*sc);
    // oreilles
    const e1=add(cone(0.22*sc,0.5*sc,0x222222),-0.3*sc,1.75*sc,0); const e2=add(cone(0.22*sc,0.5*sc,0x222222),0.3*sc,1.75*sc,0);
    const i1=add(cone(0.12*sc,0.3*sc,0xff6b8a),-0.3*sc,1.72*sc,0.05); const i2=add(cone(0.12*sc,0.3*sc,0xff6b8a),0.3*sc,1.72*sc,0.05);
    // joues
    add(ball(0.14*sc,0xff4040),-0.4*sc,1.15*sc,0.25*sc); add(ball(0.14*sc,0xff4040),0.4*sc,1.15*sc,0.25*sc);
    eye(-0.16*sc,1.35*sc,0.45*sc,0.1*sc); eye(0.16*sc,1.35*sc,0.45*sc,0.1*sc);
    // queue éclair (zigzag avec boxes)
    const t1=add(box(0.12*sc,0.5*sc,0.12*sc,C),0,0.7*sc,-0.6*sc); t1.rotation.x=0.6;
    const t2=add(box(0.35*sc,0.12*sc,0.12*sc,dark),0,0.55*sc,-0.85*sc); t2.rotation.y=0.5;
    add(ball(0.12*sc,0x222222),0,1.05*sc,0.52*sc); // nez
    g.userData.anim="bounce";
  } else if(S==="fox"||S==="foxbig"){
    const sc=S==="foxbig"?1.4:1;
    add(ball(0.55*sc,C),0,0.55*sc,0);
    add(ball(0.42*sc,light),0,1.15*sc,0.15*sc);
    add(cone(0.2*sc,0.45*sc,dark),-0.28*sc,1.6*sc,0); add(cone(0.2*sc,0.45*sc,dark),0.28*sc,1.6*sc,0);
    const tail=add(ball(0.3*sc,light),0,0.6*sc,-0.65*sc); tail.scale.set(1,1,1.6);
    eye(-0.15*sc,1.25*sc,0.5*sc); eye(0.15*sc,1.25*sc,0.5*sc);
    for(let i=0;i<4;i++) add(ball(0.13*sc,dark),(i<2?-0.25:0.25)*sc,0.13*sc,(i%2?-0.2:0.2)*sc);
    g.userData.anim="wag";
  } else if(S.startsWith("bird")){
    const big=S.includes("big"); const sc=big?1.4:1;
    add(ball(0.5*sc,C),0,0.7*sc,0);
    add(ball(0.38*sc,light),0,1.25*sc,0.1*sc);
    const beak=add(cone(0.14*sc,0.3*sc,0xffa500),0,1.2*sc,0.5*sc); beak.rotation.x=Math.PI/2;
    // ailes feuilles
    const w1=add(box(0.7*sc,0.1*sc,0.4*sc,dark),-0.6*sc,0.8*sc,0); w1.rotation.z=0.4;
    const w2=add(box(0.7*sc,0.1*sc,0.4*sc,dark),0.6*sc,0.8*sc,0); w2.rotation.z=-0.4;
    if(S.includes("leaf")){ add(cone(0.15*sc,0.4*sc,0x2f9e57),0,1.65*sc,0); }
    eye(-0.14*sc,1.35*sc,0.4*sc,0.09*sc); eye(0.14*sc,1.35*sc,0.4*sc,0.09*sc);
    g.userData.anim="flap";
  } else if(S.startsWith("lizard")){
    const sc=S.includes("big")?1.5:1;
    add(ball(0.55*sc,C),0,0.6*sc,0);
    add(ball(0.45*sc,light),0,1.2*sc,0.2*sc);
    eye(-0.16*sc,1.35*sc,0.55*sc); eye(0.16*sc,1.35*sc,0.55*sc);
    const tail=add(cone(0.2*sc,0.9*sc,dark),0,0.6*sc,-0.7*sc); tail.rotation.x=-1.2;
    const flame=add(ball(0.16*sc,0xffdd00),0,0.9*sc,-1.1*sc); flame.name="flame";
    g.userData.anim="bounce";
  } else if(S.startsWith("turtle")){
    const sc=S.includes("big")?1.5:1;
    const shell=add(ball(0.6*sc,0x2f7a4d),0,0.6*sc,0); shell.scale.set(1,0.85,1.1);
    add(ball(0.4*sc,C),0,0.75*sc,0.55*sc);
    eye(-0.13*sc,0.9*sc,0.9*sc,0.08*sc); eye(0.13*sc,0.9*sc,0.9*sc,0.08*sc);
    g.userData.anim="sway";
  } else if(S==="rat"){
    add(ball(0.4,C),0,0.4,0);
    add(ball(0.32,light),0,0.85,0.15);
    add(cone(0.12,0.3,0xff9ecb),-0.15,1.15,0); add(cone(0.12,0.3,0xff9ecb),0.15,1.15,0);
    eye(-0.11,0.92,0.42,0.07); eye(0.11,0.92,0.42,0.07);
    const t=add(box(0.08,0.08,0.7,dark),0,0.35,-0.6); t.rotation.y=0.4;
    g.userData.anim="bounce";
  } else if(S==="bird"||S==="butterfly"){
    add(ball(0.4,C),0,0.8,0);
    const w1=add(box(0.6,0.08,0.4,light),-0.5,0.9,0); const w2=add(box(0.6,0.08,0.4,light),0.5,0.9,0);
    w1.rotation.z=0.3; w2.rotation.z=-0.3;
    eye(-0.1,0.9,0.35,0.07); eye(0.1,0.9,0.35,0.07);
    g.userData.anim="flap";
  } else if(S.startsWith("rock")){
    const sc=S.includes("big")?1.5:1;
    const r=add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.6*sc),mat(C)),0,0.6*sc,0);
    r.castShadow=true;
    eye(-0.15*sc,0.75*sc,0.5*sc,0.1*sc); eye(0.15*sc,0.75*sc,0.5*sc,0.1*sc);
    add(box(0.5*sc,0.15*sc,0.2*sc,0x222222),0,0.4*sc,0.5*sc);
    if(S.includes("big")){ add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.3*sc),mat(dark)),-0.6*sc,0.4*sc,0); add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.3*sc),mat(dark)),0.6*sc,0.4*sc,0);}
    g.userData.anim="rock";
  } else if(S==="kid"){
    add(ball(0.45,0xffe0b5),0,1.0,0);
    add(ball(0.3,C),0,1.6,0);
    eye(-0.13,1.05,0.4,0.08); eye(0.13,1.05,0.4,0.08);
    const spoon=add(box(0.06,0.5,0.06,0xcccccc),0.4,1.0,0.2); spoon.rotation.z=-0.4;
    g.userData.anim="sway";
  } else if(S==="ghost"){
    const b=add(ball(0.55,C),0,0.9,0); b.scale.set(1,1.3,1);
    eye(-0.15,1.0,0.45,0.11); eye(0.15,1.0,0.45,0.11);
    add(box(0.25,0.08,0.05,0x220022),0,0.75,0.5);
    const bot=add(cone(0.4,0.4,dark),0,0.35,0); bot.rotation.x=Math.PI;
    g.userData.anim="float";
  } else if(S==="drake"){
    add(ball(0.5,C),0,0.6,0);
    add(ball(0.38,light),0,1.2,0.15);
    eye(-0.13,1.3,0.45); eye(0.13,1.3,0.45);
    const w1=add(box(0.6,0.08,0.35,0x9ecbff),-0.55,0.9,-0.1); w1.rotation.z=0.5;
    const w2=add(box(0.6,0.08,0.35,0x9ecbff),0.55,0.9,-0.1); w2.rotation.z=-0.5;
    add(cone(0.12,0.3,0xffffff),0,1.6,0);
    g.userData.anim="flap";
  } else {
    add(ball(0.5,C),0,0.7,0);
    eye(-0.13,0.85,0.42); eye(0.13,0.85,0.42);
    g.userData.anim="bounce";
  }
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;}});
  return g;
}

export function animateMonster(g,t){
  const a=g.userData.anim;
  if(a==="bounce") g.position.y = (g.userData.baseY||0) + Math.abs(Math.sin(t*4))*0.15;
  else if(a==="float") g.position.y=(g.userData.baseY||0)+Math.sin(t*2)*0.2;
  else if(a==="flap"){ g.rotation.y=Math.sin(t*1.5)*0.2; g.position.y=(g.userData.baseY||0)+Math.sin(t*5)*0.08; }
  else if(a==="wag"){ g.rotation.y=Math.sin(t*3)*0.25; }
  else if(a==="sway"){ g.rotation.z=Math.sin(t*2)*0.08; }
  else if(a==="rock"){ g.rotation.y+=0.005; }
}
