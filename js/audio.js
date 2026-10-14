// Petits sons procéduraux (aucune musique Nintendo reprise)
let ctx=null;
export function audio(){ if(!ctx){ try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} } if(ctx&&ctx.state==="suspended") ctx.resume(); return ctx; }
function tone(freq,dur=0.12,type="square",vol=0.12,when=0,slide=0){
  const c=audio(); if(!c) return;
  const t=c.currentTime+when;
  const o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,t);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+0.02);
}
export const sfx={
  talk(){tone(660,0.07,"square",0.08);},
  select(){tone(880,0.09,"square",0.1);tone(1320,0.08,"square",0.08,0.07);},
  attack(){tone(300,0.18,"sawtooth",0.14,0,-200);},
  super(){tone(200,0.3,"sawtooth",0.16,0,600);tone(900,0.2,"square",0.1,0.1);},
  weak(){tone(400,0.2,"sine",0.12,0,-150);},
  hit(){tone(150,0.15,"square",0.15);},
  capture(){tone(500,0.1,"sine",0.12);tone(700,0.1,"sine",0.12,0.1);tone(900,0.15,"sine",0.12,0.2);},
  caught(){[523,659,784,1046].forEach((f,i)=>tone(f,0.15,"square",0.1,i*0.12));},
  flee(){tone(800,0.25,"sine",0.1,0,-500);},
  heal(){[440,554,659].forEach((f,i)=>tone(f,0.2,"sine",0.1,i*0.12));},
  encounter(){tone(150,0.1,"square",0.14);tone(150,0.1,"square",0.14,0.15);tone(600,0.3,"square",0.14,0.3,400);},
  badge(){[523,659,784,1046,1318].forEach((f,i)=>tone(f,0.2,"triangle",0.12,i*0.13));},
  level(){[660,880,1100].forEach((f,i)=>tone(f,0.12,"square",0.1,i*0.09));},
};
window.addEventListener("pointerdown",()=>audio(),{once:true});
