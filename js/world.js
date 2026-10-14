import * as THREE from 'three';

export const WORLD = { size: 140, colliders: [], grass: [], trainers: [], signs: [], doors: [], npcs: [] };

// Zones le long de Z : Bourg (z 45..65), Route1 (z 0..45), Cité (z -60..0)
export function isGrass(x,z){
  // patches d'herbes sur Route 1 + forêt
  const patches=[{x:0,z:25,w:26,h:12},{x:-8,z:8,w:20,h:10},{x:6,z:-18,w:18,h:10}];
  return patches.some(p=>Math.abs(x-p.x)<p.w/2&&Math.abs(z-p.z)<p.h/2);
}
export function zoneAt(z){
  if(z>42) return "bourg";
  if(z>-8) return "route";
  return "cite";
}

function mat(c,r=0.85){return new THREE.MeshStandardMaterial({color:c,roughness:r});}

export function buildWorld(scene){
  WORLD.colliders=[]; WORLD.grass=[]; WORLD.trainers=[]; WORLD.signs=[]; WORLD.doors=[]; WORLD.npcs=[];
  scene.background=new THREE.Color(0x87ceeb);
  scene.fog=new THREE.Fog(0x87ceeb,60,160);
  const hemi=new THREE.HemisphereLight(0xbfe8ff,0x4a7c4a,0.9); scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff2cc,1.6); sun.position.set(40,60,20); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-80;sun.shadow.camera.right=80;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;
  scene.add(sun);

  // Sol avec couleurs par zone (vertex colors)
  const seg=70;
  const geo=new THREE.PlaneGeometry(WORLD.size,WORLD.size,seg,seg);
  geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position; const colors=[];
  const cBourg=new THREE.Color(0x7ec850), cRoute=new THREE.Color(0x6fbf4a), cCite=new THREE.Color(0x8a9a8a), cPath=new THREE.Color(0xe0c184);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i);
    let c;
    const zn = z>42?"bourg":(z>-8?"route":"cite");
    c = zn==="bourg"?cBourg.clone():zn==="route"?cRoute.clone():cCite.clone();
    if(Math.abs(x)<4) c=cPath.clone(); // chemin central
    if(zn==="cite"&&Math.abs(x)<14&&z<-20) c=new THREE.Color(0xb9b9b9); // place ville
    // léger bruit
    const n=Math.sin(x*0.5)*Math.cos(z*0.5)*0.03;
    c.offsetHSL(0,0,n);
    colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));
  ground.receiveShadow=true; scene.add(ground);

  // Herbes hautes (instanciées, animées)
  const grassGeo=new THREE.ConeGeometry(0.22,0.9,5);
  const grassMat=new THREE.MeshStandardMaterial({color:0x2f8f3a,roughness:1});
  const spots=[];
  for(let x=-65;x<65;x+=1.4) for(let z=-60;z<65;z+=1.4){
    if(isGrass(x,z)&&Math.abs(x)>4.5) spots.push([x+(Math.random()-0.5),z+(Math.random()-0.5)]);
  }
  const inst=new THREE.InstancedMesh(grassGeo,grassMat,spots.length);
  const d=new THREE.Object3D();
  spots.forEach((s,i)=>{d.position.set(s[0],0.45,s[1]);d.rotation.y=Math.random()*3;d.updateMatrix();inst.setMatrixAt(i,d.matrix);
    WORLD.grass.push({x:s[0],z:s[1]});});
  scene.add(inst);
  WORLD.grassMesh=inst;

  const addBox=(x,z,w,h,dd,c,ry=0)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,dd),mat(c));m.position.set(x,h/2,z);m.rotation.y=ry;m.castShadow=m.receiveShadow=true;scene.add(m);WORLD.colliders.push({x,z,r:Math.max(w,dd)/2+0.3});return m;};

  // Maisons
  function house(x,z,cWall=0xfff2d8,cRoof=0xc0392b,label){
    const g=new THREE.Group();g.position.set(x,0,z);
    const base=new THREE.Mesh(new THREE.BoxGeometry(8,4,7),mat(cWall));base.position.y=2;base.castShadow=true;g.add(base);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(6.2,3,4),mat(cRoof));roof.position.y=5.5;roof.rotation.y=Math.PI/4;roof.castShadow=true;g.add(roof);
    const door=new THREE.Mesh(new THREE.BoxGeometry(1.4,2.4,0.2),mat(0x6b4a2f));door.position.set(0,1.2,3.55);g.add(door);
    const win=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.2,0.15),mat(0xbfe8ff));win.position.set(-2.2,2.4,3.55);g.add(win);
    const win2=win.clone();win2.position.x=2.2;g.add(win2);
    scene.add(g);
    WORLD.colliders.push({x,z,r:5});
    if(label) WORLD.signs.push({x:x,z:z+4.5,text:label,range:4});
    return g;
  }
  house(-10,55,0xfff2d8,0xc0392b,"Maison du joueur");
  house(10,55,0xd8ecff,0x2e86c1,"Maison du rival");
  house(0,62,0xf9f9f9,0x27ae60,"Labo du Prof. Odo — E pour entrer/parler");
  // Cité Azur
  house(-14,-32,0xffe9c9,0x8e44ad,"Centre Monstres — E pour soigner");
  house(14,-32,0xd8ecff,0xe67e22,"Boutique — +3 Orbes offertes");
  house(0,-48,0xeeeeee,0x555555,"ARÈNE ROCHE — Championne Lina");
  WORLD.doors.push({x:-14,z:-28,label:"center"},{x:14,z:-28,label:"shop"},{x:0,z:-44,label:"gym"});

  // Labo intérieur simplifié : comptoir (décor, sans collision pour laisser l'accès au Prof)
  { const c=new THREE.Mesh(new THREE.BoxGeometry(10,1,1),mat(0x8b5a2b)); c.position.set(0,0.5,58); c.castShadow=true; scene.add(c); }

  // Arbres
  const trunkG=new THREE.CylinderGeometry(0.3,0.4,2,8), leafG=new THREE.IcosahedronGeometry(1.6,1);
  const trunkM=mat(0x6b4a2f), leafM=mat(0x2f9e44);
  function tree(x,z,s=1){
    const t=new THREE.Group();t.position.set(x,0,z);
    const tr=new THREE.Mesh(trunkG,trunkM);tr.position.y=1;tr.castShadow=true;t.add(tr);
    const l1=new THREE.Mesh(leafG,leafM);l1.position.y=2.8;l1.castShadow=true;t.add(l1);
    const l2=new THREE.Mesh(leafG,mat(0x37b34a));l2.position.y=3.8;l2.scale.setScalar(0.7);t.add(l2);
    t.scale.setScalar(s);scene.add(t);WORLD.colliders.push({x,z,r:1});return t;
  }
  for(let i=0;i<60;i++){
    const x=(Math.random()-0.5)*130, z=(Math.random()-0.5)*130;
    if(Math.abs(x)<7) continue; if(isGrass(x,z)) continue;
    if(Math.abs(x)<20&&z<-15&&z>-45) continue;
    tree(x,z,0.8+Math.random()*0.8);
  }
  // bordures du monde
  for(let x=-70;x<=70;x+=4){ tree(x,68,1.2); tree(x,-66,1.2); }
  for(let z=-66;z<=68;z+=4){ tree(-69,z,1.2); tree(69,z,1.2); }

  // Clôtures route
  for(let z=2;z<40;z+=3){ addBox(-6,z,0.3,1,0.3,0xffffff); addBox(6,z,0.3,1,0.3,0xffffff); }

  // Étang
  const pond=new THREE.Mesh(new THREE.CircleGeometry(7,24),new THREE.MeshStandardMaterial({color:0x3db2ff,roughness:0.3,metalness:0.2}));
  pond.rotation.x=-Math.PI/2;pond.position.set(24,0.05,20);scene.add(pond);
  WORLD.colliders.push({x:24,z:20,r:7});

  // Lampadaires cité
  for(const [x,z] of [[-8,-22],[8,-22],[-8,-40],[8,-40]]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,5,8),mat(0x333333));p.position.set(x,2.5,z);p.castShadow=true;scene.add(p);
    const b=new THREE.Mesh(new THREE.SphereGeometry(0.5,12,10),new THREE.MeshStandardMaterial({color:0xfff2a8,emissive:0xffd83d,emissiveIntensity:0.8}));b.position.set(x,5.2,z);scene.add(b);
    const li=new THREE.PointLight(0xffd83d,8,18);li.position.set(x,5,z);scene.add(li);
  }

  // Panneaux
  function sign(x,z,text){
    const p=new THREE.Mesh(new THREE.BoxGeometry(0.3,1.6,0.3),mat(0x6b4a2f));p.position.set(x,0.8,z);scene.add(p);
    const b=new THREE.Mesh(new THREE.BoxGeometry(2.2,1,0.2),mat(0xfdf6d8));b.position.set(x,1.7,z);scene.add(b);
    WORLD.signs.push({x,z,text,range:3.5});
    WORLD.colliders.push({x,z,r:0.8});
  }
  sign(-4.5,44,"BOURG JAUNE — Là où tout commence !");
  sign(4.5,20,"ROUTE 1 — Des monstres dans les hautes herbes !");
  sign(-4.5,-8,"CITÉ AZUR — Arène Roche au nord.");
  sign(4.5,-44,"ARÈNE : Lina, spécialiste Roche. Eau & Plante conseillées !");

  // NPC + dresseurs (positions, équipe, dialogue)
  function npc(x,z,color,name,text,team=null,reward=0,emoji="🧑"){
    const g=new THREE.Group();g.position.set(x,0,z);
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.4,0.8,6,12),mat(color));body.position.y=1;body.castShadow=true;g.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.35,16,12),mat(0xffd9b3));head.position.y=2;head.castShadow=true;g.add(head);
    const hat=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.18,12),mat(0x222222));hat.position.y=2.32;g.add(hat);
    scene.add(g);
    const o={x,z,mesh:g,name,text,team,reward,emoji,beaten:false,baseX:x,baseZ:z};
    WORLD.npcs.push(o); WORLD.colliders.push({x,z,r:0.9,npc:o});
    return o;
  }
  npc(0,59,0x4a90d9,"Prof. Odo","Bienvenue ! Prends ton Voltik et pars à l'aventure !",null,0,"🧪");
  npc(6,52,0xe74c3c,"Rival Niko","Moi aussi j'ai eu un Nébouli ! Je te battrai !",null,0,"😤");
  npc(-3,35,0x27ae60,"Dame Route","Astuce : les Orbes capturent les monstres affaiblis !",null,0,"👵");
  WORLD.trainers.push(npc(-9,28,0xf39c12,"Gamin Jo","Je m'entraîne avec mon Ratibou !",[["ratibou",6]],120,"🧒"));
  WORLD.trainers.push(npc(9,14,0xff8ac2,"Fillete Ana","Mon Piafabec est trop mignon !",[["piafabec",7]],140,"👧"));
  WORLD.trainers.push(npc(-7,2,0x8e44ad,"Bugman Théo","Les insectes, c'est la vie !",[["papivole",7],["papivole",8]],200,"🪲"));
  WORLD.trainers.push(npc(9,-16,0x7f8c8d,"Randonneur Marc","Ma défense est d'acier !",[["caillou",10]],300,"🥾"));
  npc(-12,-28,0xff6b8a,"Infirmière Joëlle","Centre Monstres : E pour soigner ton équipe.",null,0,"💚");
  npc(0,-42,0x555555,"Championne Lina","Je suis Lina ! Roche contre toi ! E pour m'affronter.",null,0,"🏆");

  // Barrières : bloquer route sans starter
  WORLD.colliders.push({x:-12,z:42,r:6,block:"no-starter"},{x:12,z:42,r:6,block:"no-starter"});
}

export function collide(x,z,hasStarter){
  for(const c of WORLD.colliders){
    if(c.block==="no-starter"&&hasStarter) continue;
    const dx=x-c.x,dz=z-c.z;
    if(dx*dx+dz*dz < c.r*c.r) return c;
  }
  if(Math.abs(x)>66||Math.abs(z)>66) return {x:Math.sign(x)*66,z:Math.sign(z)*66,r:1};
  return null;
}
