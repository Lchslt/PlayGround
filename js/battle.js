import { MOVES, MONSTERS, effectiveness } from './data.js';
import { sfx } from './audio.js';

export function makeMon(species, level){
  const base = MONSTERS[species].base;
  return {
    species, level,
    xp: level*level*10,
    hp: Math.floor(base.hp + level*3), maxhp: Math.floor(base.hp + level*3),
    atk: Math.floor(base.atk + level*1.2), def: Math.floor(base.def + level*1.1),
    spd: Math.floor(base.spd + level*1.1),
    moves: [...MONSTERS[species].moves].slice(0,4),
    status: null,
  };
}
export function statsFor(species, level){
  const b=MONSTERS[species].base;
  return {maxhp:Math.floor(b.hp+level*3),atk:Math.floor(b.atk+level*1.2),def:Math.floor(b.def+level*1.1),spd:Math.floor(b.spd+level*1.1)};
}
export function calcDamage(att, def, moveId){
  const mv=MOVES[moveId];
  if(!mv||mv.power===0) return {dmg:0};
  const stab = MONSTERS[att.species].types.includes(mv.type)?1.5:1;
  const eff = effectiveness(mv.type, MONSTERS[def.species].types);
  const rand=0.85+Math.random()*0.15;
  const dmg=Math.max(1,Math.floor((((2*att.level/5+2)*mv.power*(att.atk/Math.max(1,def.def)))/50+2)*stab*eff*rand));
  return {dmg,eff,stab};
}
export function xpNeed(level){ return level*level*10; }
export function gainXp(mon, amount, log){
  mon.xp+=amount;
  let ups=0;
  while(mon.xp>=xpNeed(mon.level+1) && mon.level<50){
    mon.level++;
    const s=statsFor(mon.species,mon.level);
    mon.maxhp=s.maxhp;mon.atk=s.atk;mon.def=s.def;mon.spd=s.spd;
    mon.hp=Math.min(mon.maxhp,mon.hp+Math.floor(mon.maxhp*0.3));
    ups++;
    log(`${MONSTERS[mon.species].name} monte au niveau ${mon.level} !`);
    // évolution
    const evo=MONSTERS[mon.species].evo;
    if(evo&&mon.level>=evo.at){
      const old=MONSTERS[mon.species].name;
      mon.species=evo.into;
      const s2=statsFor(mon.species,mon.level);
      mon.maxhp=s2.maxhp;mon.atk=s2.atk;mon.def=s2.def;mon.spd=s2.spd;mon.hp=mon.maxhp;
      mon.moves=[...MONSTERS[mon.species].moves].slice(0,4);
      log(`Incroyable ! ${old} évolue en ${MONSTERS[mon.species].name} !`);
      sfx.level();
    }
  }
  return ups;
}
export function catchChance(foe, orbsUsed=1){
  const base=MONSTERS[foe.species].catchRate;
  const hpFactor=(3*foe.maxhp-2*foe.hp)/(3*foe.maxhp);
  const lvlFactor=Math.max(0.3,1-(foe.level/60));
  return Math.min(0.95, (base/255)*hpFactor*lvlFactor + 0.05*orbsUsed);
}
