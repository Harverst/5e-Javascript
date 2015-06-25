var ejs = require('ejs');
var fs = require('fs');
var chance = require('chance')();
var humanNames = {
  Calishite: {
    male: ['Aseir', 'Bardeid', 'Haseid', 'Khemed', 'Mehmen', 'Sudeiman', 'Zasheir'],
    female: ['Atala', 'Ceidil', 'Hama', 'Jasmal', 'Meilil', 'Seipora', 'Yasheira', 'Zasheida'],
    surname: ['Basha', 'Dumein', 'Jassan', 'Khalid', 'Mostana', 'Pashar', 'Rein']
  },
  Rashemi: {
    male: ['Borivik', 'Faurgar', 'Jandar', 'Kanithar', 'Madislak', 'Ralmevik', 'Shaumar', 'Vladislak'],
    female: ['Fyevarra', 'Hulmarra', 'Immith', 'Imzel', 'Navarra', 'Shevarra', 'Tammith', 'Yuldra'],
    surname: ['Chergoba', 'Dyernina', 'Iltazyara', 'Murnyethara', 'Stayanoga', 'Ulmokina']
  }
}

var sigmund = {
  name: "Sigmund Ohm",
  desc: "A 45 year-old Criminal Hill Dwarf Ranger.",
  ac: 14,
  perception: 13,
  prof: 3,
  alignment: 'Chaotic Good.',
  hitDice: "49 (5d10+15)",
  aScore: {
    str: 14,
    dex: 12,
    con: 14,
    int: 7,
    wis: 16,
    cha: 12
  },
  saving: {
    str: true,
    dex: true,
    con: true
  },
  skills: [
    'Animal Handling',
    'Deception',
    'Stealth',
    'Survival'
  ],
  lang: [
    'Common'
  ],
  abil: [
    'Test Ability',
    'Darkvision',
    'Light and Medium Armor'
  ],
  equip: [
    {name: 'Shortsword x2', weight: 4},
    {name: 'Longbow', weight: 2},
  ],
  attacks: [
    {name: 'Ohmbreak', desc: 'Ohmbreaker!'}
  ]
};

var equipList = [
  {item:{name: 'Ration x10', weight: 10}, odds: 0.5, exclusive: 'ration'},
  {item:{name: 'Ration x20', weight: 20}, odds: 0.5, exclusive: 'ration'},
  {item:{name: 'Longsword', weight: 2}, odds: 0.1, exclusive: 'melee'},
  {item:{name: 'Shortsword', weight: 2}, odds: 0.1, exclusive: 'melee'},
  {item:{name: 'Shortsword x2', weight: 4}, odds: 0.1, exclusive: 'melee'},
  {item:{name: 'Longbow', weight: 2}, odds: 0.1, exclusive: 'range'},
  {item:{name: 'Chain Mail', weight: 12}, odds: 0.1, exclusive: 'armor'},
  {item:{name: 'Ruby Necklace', weight: 2}, odds: 0.1},
  {item:{name: 'Copper Pieces x25', weight: 1}, odds: 0.1, exclusive: 'money'},
  {item:{name: 'Copper Pieces x50', weight: 2}, odds: 0.1, exclusive: 'money'},
  {item:{name: 'Silver Pieces x1', weight: 0.1}, odds: 0.1, exclusive: 'money'},
  {item:{name: 'Gold Pieces x1', weight: 1}, odds: 0.1, exclusive: 'money'},
  {item:{name: 'Gold Pieces x50', weight: 50}, odds: 0.05, exclusive: 'money'},
  {item:{name: 'Trinket', weight: 2}, odds: 0.1}
];

var randomEquip = function() {
  var exclusive = {};
  var itms = [];
  for(e in equipList){
    var itm = equipList[e];
    if(itm.odds >= chance.floating({min:0,max:1})){
      if(itm.exclusive) {
        if(!exclusive[itm.exclusive]) {
          exclusive[itm.exclusive] = [];
        }
        exclusive[itm.exclusive].push(itm.item);
      }
      else {itms.push(itm.item)}
    }
  }
  for(e in exclusive) {
    var el = exclusive[e];
    if(el.length <= 0) { break; }
    var pick = chance.integer({min: 0, max: el.length-1});
    itms.push(el[pick]);
  }
  return itms;
};



var displayString = function(num) {
  if(num >= 0){
    return '+' + num;
  }
  return num;
}
var calculateModifiers = function(ch) {

  ch.mod = ch.mod || {};
  ch.mod.str = ch.mod.str || displayString(Math.floor((ch.aScore.str - 10)/2));
  ch.mod.dex = ch.mod.dex || displayString(Math.floor((ch.aScore.dex - 10)/2));
  ch.mod.con = ch.mod.con || displayString(Math.floor((ch.aScore.con - 10)/2));
  ch.mod.int = ch.mod.int || displayString(Math.floor((ch.aScore.int - 10)/2));
  ch.mod.wis = ch.mod.wis || displayString(Math.floor((ch.aScore.wis - 10)/2));
  ch.mod.cha = ch.mod.cha || displayString(Math.floor((ch.aScore.cha - 10)/2));
}
var calculateEquipWeight = function(cha) {
  var w = 0;
  for(e in cha.equip) {
    w += cha.equip[e].weight;
  }
  cha.totalWeight = cha.totalWeight || w;
}
var calculateAttacks = function(cha) {
  var attacks = cha.attacks || [];
  for(var e in cha.equip) {
    switch(cha.equip[e].name) {
      case 'Shortsword x2':
        attacks.push({name: 'Multiattack', desc: cha.name + " makes two Shortsword attacks."});
      case 'Shortsword':
        var hit = parseInt(cha.mod.str) + cha.prof;
        var dmg = parseInt(cha.mod.str);
        attacks.push({name: 'Shortsword', desc: displayString(hit)+" to hit. 1d6"+displayString(dmg)+" slashing."});
        break;
      case 'Longbow':
        var hit = parseInt(cha.mod.dex) + cha.prof;
        var dmg = parseInt(cha.mod.dex);
        attacks.push({name: 'Longbow', desc: displayString(hit)+" to hit. 1d8"+displayString(dmg)+" piercing. Loading, Ammunition, and Range (150/300)."});
    }
  }
  cha.attacks = attacks;
}
var hasSkill = function(cha, skill) {
  var values = {}
  cha.skills.forEach(function(o){
    values[o.value] = true;
  });
  if (values[skill]) {
    return true;
  }
  return false;
}

calculateModifiers(sigmund);
calculateEquipWeight(sigmund);

var result = ejs.render(fs.readFileSync("CharTexTemplate.ejs")+'', sigmund);

//Create random NPCs
for(var i = 0; i < 20; i++) {


  var charType = humanNames.Rashemi;
  var charTypeName = "Rashemi";
  var counter = 0;
  var count = 0;
  for (var prop in humanNames) {
    if (Math.random() < 1/++count) {
      charTypeName = prop;
    }
  }
  charType = humanNames[charTypeName];
  
  console.log(charTypeName);
  var gender = chance.gender();
  chance.set('firstNames', charType);
  chance.set('lastNames', charType.surname);
  var randomChar = {
    name: chance.name({gender: gender}),
    desc: "A " + chance.age() + " year-old "+gender+" "+charTypeName+" Human.",
    ac: chance.integer({min:9, max:15}),
    hitDice: '20',
    prof: 1,
    perception: chance.integer({min:8, max:13}),
    aScore: {
      str: chance.integer({min:7, max:15}),
      dex: chance.integer({min:7, max:15}),
      con: chance.integer({min:7, max:15}),
      int: chance.integer({min:7, max:15}),
      wis: chance.integer({min:7, max:15}),
      cha: chance.integer({min:7, max:15})
    },
    alignment: "True Neutral.",
    skills: ['None'],
    abil: [],
    lang: ['Common'],
    equip: randomEquip(),
    saving: [],
    attacks: []
  };
  console.log(randomChar.equip);
  calculateModifiers(randomChar);
  calculateEquipWeight(randomChar);
  calculateAttacks(randomChar);
  console.log(randomChar.attacks);
  var texchar = ejs.render(fs.readFileSync("CharTexTemplate.ejs")+'', randomChar)+"\n";
  fs.appendFileSync("output.tex",texchar);
}

//console.log(result);