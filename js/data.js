// Données originales — hommage, aucune espèce Nintendo reprise.
export const TYPES = ["Normal","Electrik","Feu","Eau","Plante","Vol","Insecte","Roche","Sol","Psy","Spectre","Dragon"];
export const CHART = {
  Electrik:{Eau:2,Vol:2,Electrik:0.5,Plante:0.5,Sol:0,Roche:1},
  Feu:{Plante:2,Insecte:2,Feu:0.5,Eau:0.5,Roche:0.5,Dragon:0.5},
  Eau:{Feu:2,Sol:2,Roche:2,Eau:0.5,Plante:0.5,Dragon:0.5},
  Plante:{Eau:2,Sol:2,Roche:2,Feu:0.5,Plante:0.5,Vol:0.5,Insecte:0.5,Dragon:0.5},
  Vol:{Plante:2,Insecte:2,Electrik:0.5,Roche:0.5},
  Insecte:{Plante:2,Psy:2,Feu:0.5,Vol:0.5,Roche:0.5,Spectre:0.5},
  Roche:{Feu:2,Vol:2,Insecte:2,Sol:0.5},
  Sol:{Feu:2,Electrik:2,Roche:2,Plante:0.5,Vol:0},
  Normal:{Roche:0.5,Spectre:0},
  Psy:{Psy:0.5,Spectre:0.5},
  Spectre:{Psy:2,Spectre:2,Normal:0},
  Dragon:{Dragon:2},
};
export function effectiveness(moveType, defTypes){
  let m = 1;
  for (const t of defTypes) m *= (CHART[moveType]?.[t] ?? 1);
  return m;
}
export const MOVES = {
  charge:{name:"Charge",type:"Normal",power:40,acc:100,pp:35,desc:"Charge l'ennemi."},
  rugissement:{name:"Rugissement",type:"Normal",power:0,acc:100,pp:40,desc:"Baisse l'Attaque.",effect:"atk-down"},
  etincelle:{name:"Étincelle",type:"Electrik",power:65,acc:100,pp:20,desc:"Éclair paralysant. 30% paralysie."},
  viveattaque:{name:"Vive-Attaque",type:"Normal",power:55,acc:100,pp:30,desc:"Frappe en premier.",prio:1},
  fouet:{name:"Tranch'Herbe",type:"Plante",power:45,acc:100,pp:25,desc:"Lames de feuilles."},
  flammette:{name:"Flammette",type:"Feu",power:60,acc:100,pp:25,desc:"Petite flamme. 10% brûlure."},
  bulles:{name:"Bulles d'O",type:"Eau",power:55,acc:100,pp:25,desc:"Bulles rapides. 10% baisse Vit."},
  picpic:{name:"Picpic",type:"Vol",power:60,acc:100,pp:20,desc:"Attaque aérienne."},
  dard:{name:"Dard-Miel",type:"Insecte",power:55,acc:95,pp:20,desc:"Dard insecte."},
  jetpierre:{name:"Jet-Pierre",type:"Roche",power:50,acc:90,pp:15,desc:"Lance un rocher."},
  tunnel:{name:"Tunnel",type:"Sol",power:70,acc:100,pp:15,desc:"Creuse puis frappe."},
  chocpsy:{name:"Choc Psy",type:"Psy",power:65,acc:100,pp:20,desc:"Onde mentale."},
  griffe:{name:"Griffe Ombre",type:"Spectre",power:60,acc:100,pp:20,desc:"Griffe spectrale."},
  draco:{name:"Souffle Drak",type:"Dragon",power:70,acc:100,pp:15,desc:"Souffle draconique."},
  morsure:{name:"Morsure",type:"Normal",power:60,acc:100,pp:25,desc:"Mord, peut apeurer."},
  tornado:{name:"Tornade",type:"Vol",power:40,acc:100,pp:35,desc:"Tornade légère."},
  pistoleau:{name:"Pistolet O",type:"Eau",power:40,acc:100,pp:25,desc:"Jet d'eau."},
  flammeche2:{name:"Brasier",type:"Feu",power:90,acc:100,pp:15,desc:"Grosse flamme."},
  tonnerre:{name:"Tonnerre",type:"Electrik",power:90,acc:100,pp:15,desc:"Foudre puissante."},
  lame:{name:"Lame-Feuille",type:"Plante",power:90,acc:100,pp:15,desc:"Feuille tranchante."},
  hydro:{name:"Hydro-Vague",type:"Eau",power:90,acc:100,pp:15,desc:"Vague géante."},
};
export const MONSTERS = {
  voltik:{name:"Voltik",types:["Electrik"],base:{hp:45,atk:55,def:40,spd:90},color:0xffd83d,shape:"mouse",desc:"Souris Volt. Joueuse, elle suit son dresseur partout.",moves:["charge","rugissement","etincelle","viveattaque"],evo:{at:16,into:"voltax"},catchRate:200},
  voltax:{name:"Voltax",types:["Electrik"],base:{hp:65,atk:90,def:60,spd:110},color:0xffb300,shape:"mousebig",desc:"Évolution de Voltik. Ses joues crépitent.",moves:["etincelle","viveattaque","tonnerre","morsure"],catchRate:90},
  nebouli:{name:"Nébouli",types:["Normal"],base:{hp:55,atk:55,def:50,spd:55},color:0xc9a06a,shape:"fox",desc:"Renardeau adaptable, compagnon du rival.",moves:["charge","rugissement","morsure","viveattaque"],evo:{at:20,into:"nebros"},catchRate:200},
  nebros:{name:"Nébros",types:["Normal"],base:{hp:80,atk:85,def:70,spd:80},color:0xa87f4d,shape:"foxbig",desc:"Évolution de Nébouli. Fidèle et courageux.",moves:["morsure","viveattaque","tunnel","griffe"],catchRate:90},
  verdibou:{name:"Verdibou",types:["Plante","Vol"],base:{hp:45,atk:49,def:49,spd:65},color:0x58c96b,shape:"birdleaf",desc:"Oisillon feuille qui chante à l'aube.",moves:["charge","fouet","picpic","tornado"],evo:{at:18,into:"verdailes"},catchRate:180},
  verdailes:{name:"Verdailes",types:["Plante","Vol"],base:{hp:65,atk:80,def:75,spd:90},color:0x2f9e57,shape:"birdleafbig",desc:"Ses ailes-feuilles claquent comme des drapeaux.",moves:["fouet","picpic","lame","tornado"],catchRate:80},
  flameche:{name:"Flamèche",types:["Feu"],base:{hp:50,atk:60,def:45,spd:65},color:0xff7a3d,shape:"lizard",desc:"Petit lézard dont la queue brûle doucement.",moves:["griffe","rugissement","flammette","morsure"],evo:{at:18,into:"flamadore"},catchRate:180},
  flamadore:{name:"Flamadore",types:["Feu"],base:{hp:70,atk:95,def:65,spd:85},color:0xe23d28,shape:"lizardbig",desc:"Sa flamme rugit quand il est motivé.",moves:["flammette","morsure","flammeche2","tunnel"],catchRate:80},
  aqualin:{name:"Aqualin",types:["Eau"],base:{hp:50,atk:55,def:55,spd:50},color:0x4db2ff,shape:"turtle",desc:"Tortue d'étang, coquille douce.",moves:["charge","bulles","pistoleau","morsure"],evo:{at:18,into:"aqualithe"},catchRate:180},
  aqualithe:{name:"Aqualithe",types:["Eau"],base:{hp:80,atk:85,def:90,spd:60},color:0x2477d8,shape:"turtlebig",desc:"Sa carapace protège toute l'équipe.",moves:["bulles","hydro","morsure","jetpierre"],catchRate:80},
  ratibou:{name:"Ratibou",types:["Normal"],base:{hp:35,atk:50,def:35,spd:70},color:0x9b8cff,shape:"rat",desc:"Ronge tout ce qui traîne sur la Route 1.",moves:["charge","viveattaque","morsure"],catchRate:255},
  piafabec:{name:"Piafabec",types:["Normal","Vol"],base:{hp:40,atk:50,def:40,spd:70},color:0x8a6f4d,shape:"bird",desc:"Piaille dès le lever du soleil.",moves:["charge","picpic","tornado"],catchRate:220},
  papivole:{name:"Papivole",types:["Insecte","Vol"],base:{hp:45,atk:45,def:50,spd:70},color:0x7fe3d0,shape:"butterfly",desc:"Poudre d'ailes scintillante.",moves:["dard","tornado","picpic"],catchRate:220},
  caillou:{name:"Caillou",types:["Roche","Sol"],base:{hp:50,atk:70,def:90,spd:30},color:0x9a9a9a,shape:"rock",desc:"Vit dans la Grotte Azur. Dur comme la pierre.",moves:["charge","jetpierre","tunnel"],catchRate:200},
  grolive:{name:"Grolive",types:["Roche","Sol"],base:{hp:80,atk:110,def:120,spd:40},color:0x6b6b6b,shape:"rockbig",desc:"Star de l'Arène Roche.",moves:["jetpierre","tunnel","morsure"],catchRate:90},
  psykid:{name:"Psykid",types:["Psy"],base:{hp:40,atk:45,def:40,spd:80},color:0xff7fd4,shape:"kid",desc:"Lit les pensées avec sa cuillère.",moves:["chocpsy","viveattaque"],catchRate:180},
  fantou:{name:"Fantou",types:["Spectre"],base:{hp:45,atk:60,def:45,spd:80},color:0x6a5acd,shape:"ghost",desc:"Farceur qui hante le cimetière.",moves:["griffe","chocpsy"],catchRate:170},
  minidrak:{name:"Minidrak",types:["Dragon"],base:{hp:55,atk:70,def:55,spd:70},color:0x3d6bff,shape:"drake",desc:"Très rare. Rêve de voler comme un grand dragon.",moves:["draco","morsure","flammette","bulles"],catchRate:45},
};
export const WILD_TABLES = {
  route1:[["ratibou",3,5,40],["piafabec",3,5,30],["papivole",4,6,15],["verdibou",4,6,10],["aqualin",5,5,5]],
  foret:[["papivole",5,8,30],["verdibou",6,9,30],["psykid",5,7,15],["piafabec",5,8,15],["flameche",6,6,10]],
  grotte:[["caillou",8,12,45],["fantou",8,11,25],["psykid",9,11,15],["minidrak",10,12,3],["ratibou",8,10,12]],
  eau:[["aqualin",8,12,60],["minidrak",10,12,5]],
};
export const TRAINERS = [
  {name:"Gamin Jo",team:[["ratibou",6]],reward:120,text:"Je m'entraîne avec mon Ratibou !"},
  {name:"Fillete Ana",team:[["piafabec",7]],reward:140,text:"Mon Piafabec est trop mignon !"},
  {name:"Bugman Théo",team:[["papivole",7],["papivole",8]],reward:200,text:"Les insectes, c'est la vie !"},
  {name:"Randonneur Marc",team:[["caillou",10]],reward:300,text:"Ma défense est d'acier !"},
];
export const GYM = {name:"Championne Roche Lina",team:[["caillou",12],["grolive",14]],reward:800,badge:"Badge Roche"};
export const RIVAL_TEAM_1 = [["nebouli",6]];
export const RIVAL_TEAM_2 = [["nebouli",14],["piafabec",13]];
