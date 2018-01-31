//defines the various mixins that can be added to an Entity
import {Message} from './message.js';
import {SCHEDULER} from './timing.js';
import {Races} from './races.js'
import {Classes} from './classes.js'
//import {Equiptment} from './equiptment.js'
//import {Feats} from './feats.js'
//import {Skills} from './skills.js'
import {LevelsData} from './levels.js'
import {AtWills, Encounters, Dailies, Utilities} from './attacks.js'
import ROT from 'rot-js';


let exampleMixin = {
  META:{
    mixinName: 'ExampleMixin',
    mixinGroupName: 'ExampleMixinGroup',
    stateNameSpace: '_ExampleMixin',
    stateModel: {
      foo: 10
    },
    initialize: function(){
      //do any initialization
    }
  },
  METHODS: {
    method1: function(p){
      //do stuff
      //can access / manipulate this.state.ExampleMixin
    }
  },
  LISTENERS: {
    'evtLabel': function(evtData) {

    }
  }
};

//******************************************
// Basic Character Movement, Tracking, and Messaging
//******************************************
export let PlayerMessage = {
  META:{
    mixinName: 'PlayerMessage',
    mixinGroupName: 'Messager',
    stateModel: {
      timeTaken: 0
    },
  },
  LISTENERS: {
    'wallBlocked': function(evtData) {
      Message.send(this.getName() + ' can\'t move there because ' + evtData.reason);
    },
    'attacks': function(evtData) {
      Message.send(this.getName() + " attacks " + evtData.target.getName());
    },
    'damages': function(evtData) {
      Message.send(this.getName() + " deals "+ evtData.damageAmount + " damage to " + evtData.target.getName());
    },
    'kills': function(evtData) {
      Message.send(this.getName() + " kills the " + evtData.target.getName());
    },
    'surges': function() {
      Message.send(this.getName() + " surges for " + this.getSurgeVal() + " health");
    },
    'levelUpMessage': function() {
      Message.send(this.getName() + " has leveled up to level " + this.getLevel());
    },
    'chooseTwo': function() {
      Message.send("Choose two stats to raise");
    },
    'choosingAttack': function(evtData){
      Message.send("You have chosen " + evtData.attack)
    }
  }
};

//******************************************

export let EnemyMessage = {
  META:{
    mixinName: 'EnemyMessage',
    mixinGroupName: 'Messager',
    stateModel: {
      timeTaken: 0
    },
  },
  LISTENERS: {
    'attacks': function(evtData){
      Message.send(this.getName() + " attacks " + evtData.target.getName());
    },
    'damages': function(evtData){
      Message.send(this.getName() + " deals "+ evtData.damageAmount + " damage to " + evtData.target.getName());
    },
    'kills': function(evtData){
      Message.send(this.getName() + " kills the " + evtData.target.getName());
    },
    'surges': function(){
      Message.send(this.getName() + " surges for " + this.getSurgeVal() + " health");
    },
    'noMoves': function() {
      Message.send('You have gone as far as your speed allows.')
    }
  }
};

//******************************************

export let TimeTracker = {
  META:{
    mixinName: 'TimeTracker',
    mixinGroupName: 'Tracker',
    stateNameSpace: '_TimeTracker',
    stateModel: {
      timeTaken: 0
    },
  },
  METHODS:{
    getTime: function(){
      return this.state._TimeTracker.timeTaken
    },
    setTime: function(t){
      this.state._TimeTracker.timeTaken = t
    },
    addTime: function(t){
      this.state._TimeTracker.timeTaken += t
    }
  },
  LISTENERS: {
    'turnTaken': function(evtData) {
      this.addTime(evtData.timeUsed);
    }
  }
};

//******************************************

export let WalkerCorporeal = {
  META:{
    mixinName: 'WalkerCorporeal',
    mixinGroupName: 'Walker',
  },
  METHODS:{
    tryWalk: function(dx, dy){
      let moves = 0;
      if (this.getMove() != 0){
        if (moves == this.getSpeed()) {
          this.raiseMixinEvent('noMoves');
          this.raiseMixinEvent('spendMove');
          moves = 0;
          return false;
        }
      } else if (this.getMove() == 0){
        this.raiseMixinEvent('noMoves');
        return false;
      }
      let newX = this.state.x*1 + dx*1;
      let newY = this.state.y*1 + dy*1;

      let  targetPositionInfo = this.getMap().getTargetPositionInfo(newX, newY);

      if (targetPositionInfo.entity){
        this.raiseMixinEvent('wallBlocked', {reason: 'someone\'s already there'});

        return false;
      } else {
        if (targetPositionInfo.tile.isImpassable()) {
          this.raiseMixinEvent('wallBlocked', {reason: 'there\'s something in the way'});
          return false
        } else {
          this.state.x = newX;
          this.state.y = newY;
          this.getMap().updateEntityPosition(this, this.state.x, this.state.y);
          moves = moves + 1;
          this.raiseMixinEvent('turnTaken', {timeUsed: 1});
          this.raiseMixinEvent('actionDone', {timeUsed: 1});
          this.raiseMixinEvent('spendMoveAction', {spender: this, spent: 1});

          return true;
        }
        this.raiseMixinEvent('wallBlocked', {reason: 'there\'s something in the way'});
        return false;
      }
    }
  }
};
//******************************************
//Stats, EXP, Levels, Defenses, and HP
//******************************************

export let HitPoints = {
  META:{
    mixinName: 'HitPoints',
    mixinGroupName: 'HitPoints',
    stateNameSpace: '_HitPoints',
    stateModel: {
      maxHp: 1,
      curHp: 1
    },
    initialize: function(template){
      if(template.type == 'player'){
        this.state._HitPoints.maxHp = this.getCon() + this.getClassAttributes()['hp'];
        this.state._HitPoints.levelUpHp = this.getClassAttributes()['levelHP'];
        this.state._HitPoints.surges = this.getClassAttributes()['surges'] + this.getAbilityMod('constitution');
      } else {
        this.state._HitPoints.maxHp = template.maxHp;
        this.state._HitPoints.surges = template.surges || 0;
      }
      this.state._HitPoints.surgeVal = template.surgeVal || Math.floor(this.getHp()/4);
      this.state._HitPoints.curHp = this.state._HitPoints.maxHp || template.curHp;
      this.state._HitPoints.bloodied = false;
    }
  },
  METHODS: {
    gainHp: function (amt){
      this.state._HitPoints.curHp += amt;
      this.state._HitPoints.curHp = Math.min(this.state._HitPoints.maxHp, this.state._HitPoints.curHp);
    },
    loseHp: function (amt){
      this.state._HitPoints.curHp -= amt;
      this.state._HitPoints.curHp = Math.min(this.state._HitPoints.maxHp, this.state._HitPoints.curHp);
    },
    getHp: function (){
      return this.state._HitPoints.curHp;
    },
    setHp: function (amt){
      this.state._HitPoints.curHp = amt;
      this.state._HitPoints.curHp = Math.min(this.state._HitPoints.maxHp, this.state._HitPoints.curHp);
    },
    getMaxHp: function (){
      return this.state._HitPoints.maxHp;
    },
    setMaxHp: function (amt){
      this.state._HitPoints.maxHp = amt;
    },
    getSurges: function (){
      return this.state._HitPoints.surges;
    },
    setSurges: function (amt){
      this.state._HitPoints.surges = amt;
    },
    useSurge: function() {
      this.state._HitPoints.surges -= amt;
      this.gainHp(this.getSurgeVal());
    },
    getSurgeVal: function (){
      return this.state._HitPoints.surgeVal;
    },
    setSurgeVal: function (){
      this.state._HitPoints.surgeVal = Math.floor(this.getHp()/4);
    },
    getBloodied: function (){
      return this.state._HitPoints.bloodied;
    },
    setBloodied: function (value){
      this.state._HitPoints.bloodied = value;
    },
  },
  LISTENERS: {
    'damaged': function(evtData) {

      this.loseHp(evtData.damageAmount);
      evtData.src.raiseMixinEvent('damages',{target: this, damageAmount: evtData.damageAmount});
      if (this.getHp() <= Math.floor(this.getMaxHp()/2)){
        this.setBloodied(true);
      }
      if (this.getHp() <= 0) {
        SCHEDULER.remove(this);
        evtData.src.raiseMixinEvent('kills',{target: this});
        this.destroy();
      }
    },
    'surge': function(){
      this.useSurge();
      this.raiseMixinEvent('surges')
    }
  }
};

//******************************************

export let ExpPlayer = {
  META:{
    mixinName: 'ExpPlayer',
    mixinGroupName: 'Exp',
    stateNameSpace: '_ExpPlayer',
    stateModel: {
      exp: 0,
    },
  },
  METHODS: {
    getXP: function() {
      return this.state._ExpPlayer.exp;
    },
    setXP: function(xp) {
      this.state._ExpPlayer.exp = xp;
    },
    addXP: function(xp) {
      this.state._ExpPlayer.exp += xp;
    },
  },
  LISTENERS: {
  }
};

//******************************************

// export let ExpEnemy = {
//   META:{
//     mixinName: 'ExpEnemy',
//     mixinGroupName: 'Exp',
//     stateNameSpace: '_ExpEnemy',
//     stateModel: {
//       exp: 1,
//     },
//     initialize: function(template) {
//       this.state._ExpEnemy.exp = template.exp || 1;
//     }
//   },
//   METHODS: {
//     getXP: function() {
//       return this.state._ExpEnemy.exp;
//     },
//     setXP(xp) {
//       this.state._ExpEnemy.exp = xp;
//     }
//   },
// };

//******************************************
export let Levels = {
  META:{
    mixinName: 'Levels',
    mixinGroupName: 'Level',
    stateNameSpace: '_Levels',
    stateModel: {
      level: 1
    },
    initialize: function(template) {
      this.state._Levels.level = 1;
    },
  },
  METHODS: {
    getLevel: function(){
      return this.state._Levels.level;
    },
    setLevel: function(level) {
      this.state._Levels.level = level;
    },
    addLevel: function() {
      this.state._Levels.level += 1;
    },
    getLevelInfo(level) {
      return LevelsData[level];
    },
    checkLeveled: function() {
      let requiredXp = LevelsData[this.getLevel()+1]['exp'];
      if (this.getXP() >= requiredXp){
        this.addLevel();
        this.raiseMixinEvent('levelUpMessage');
        this.raiseMixinEvent('leveler');
        this.checkLeveled();
        return true;
      }
      return false;
    }
  },
  LISTENERS: {
    'levelUp': function(){
      this.checkLeveled()
    },
    'leveler': function() {
      let level = LevelsData[this.getLevel()]
      raiseMixinEvent('newAttacks', {attacks: level.newAttacks});
      raiseMixinEvent('newStats', {attacks: level.newStats});
      //raiseMixinEvent('newFeats' {attacks: level.newAttacks});
    }
  }
};

//******************************************

export let PlayerStats = {
  META:{
    mixinName: 'PlayerStats',
    mixinGroupName: 'Stats',
    stateNameSpace: '_PlayerStats',
    stateModel: {
      strength: 10,
      constitution: 10,
      dexterity: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      statPoints: 0
    },
    initialize: function(template) {
      this.state._PlayerStats.strength = template.strength + this.getRaceAttributes()['strength'] || 0;
      this.state._PlayerStats.constitution = template.constitution + this.getRaceAttributes()['constitution'] || 0;
      this.state._PlayerStats.dexterity = template.dexterity + this.getRaceAttributes()['dexterity'] || 0;
      this.state._PlayerStats.intelligence = template.intelligence + this.getRaceAttributes()['intelligence'] || 0;
      this.state._PlayerStats.wisdom = template.wisdom + this.getRaceAttributes()['wisdom'] || 0;
      this.state._PlayerStats.charisma = template.charisma + this.getRaceAttributes()['charisma'] || 0;
    }
  },
  METHODS: {
    getStr: function(){
      return this.state._PlayerStats.strength;
    },
    setStr: function(strength){
      this.state._PlayerStats.strength = strength;
    },
    addStr: function(strength){
      this.state._PlayerStats.strength += strength;
    },
    getCon: function(){
      return this.state._PlayerStats.constitution;
    },
    setCon: function(constitution){
      this.state._PlayerStats.constitution = constitution;
    },
    addCon: function(constitution){
      this.state._PlayerStats.constitution += constitution;
    },
    getDex: function(){
      return this.state._PlayerStats.dexterity;
    },
    setDex: function(dexterity){
      this.state._PlayerStats.dexterity = dexterity;
    },
    addDex: function(dexterity){
      this.state._PlayerStats.dexterity += dexterity;
    },
    getInt: function(){
      return this.state._PlayerStats.intelligence;
    },
    setInt: function(intelligence){
      this.state._PlayerStats.intelligence = intelligence;
    },
    addInt: function(intelligence){
      this.state._PlayerStats.intelligence += intelligence;
    },
    getWis: function(){
      return this.state._PlayerStats.wisdom;
    },
    setWis: function(wisdom){
      this.state._PlayerStats.wisdom = wisdom;
    },
    addWis: function(wisdom){
      this.state._PlayerStats.wisdom += wisdom;
    },
    getCha: function(){
      return this.state._PlayerStats.charisma;
    },
    setCha: function(charisma){
      this.state._PlayerStats.charisma = charisma;
    },
    addCha: function(charisma){
      this.state._PlayerStats.charisma += charisma;
    },
    getSP: function(){
      return this.state._PlayerStats.statPoints;
    },
    setSP: function(statPoints){
      this.state._PlayerStats.statPoints = statPoints;
    },
    addSP: function(statPoints){
      this.state._PlayerStats.statPoints += statPoints;
    },
    getAbilityMod: function(stat){
      if (stat == 'strength') {
        return Math.floor(this.getStr()/2 - 5);
      }
      if (stat == 'constitution') {
        return Math.floor(this.getCon()/2 - 5);
      }
      if (stat == 'dexterity') {
        return Math.floor(this.getDex()/2 - 5);
      }
      if (stat == 'intelligence') {
        return Math.floor(this.getInt()/2 - 5);
      }
      if (stat == 'wisdom') {
        return Math.floor(this.getWis()/2 - 5);
      }
      if (stat == 'charisma') {
        return Math.floor(this.getCha()/2 - 5);
      }
    }
  },
  LISTENERS: {
    'newStats': function(evtData){
      if (evtData.newStats == 'all'){
        this.addStr(1);
        this.addCon(1);
        this.addDex(1);
        this.addInt(1);
        this.addWis(1);
        this.addCha(1);
        return true;
      } else {
        this.raiseMixinEvent('chooseTwo');
        return false;
      }
    },
    'chooseTwo': function(evtData){
      this.addSP(2);
      return true;
    }
  }
};

//******************************************

export let Defenses = {
  META:{
    mixinName: 'Defenses',
    mixinGroupName: 'Defense',
    stateNameSpace: '_Defenses',
    stateModel: {
      armorClass: 10,
      fortitude: 10,
      reflex: 10,
      will: 10,
    },
    initialize: function(template) {
      if (this.getClass){
        this.state._Defenses.armorClass = Math.floor(10+this.getLevel()/2) + this.getClassAttributes()['armorClass'];
        this.state._Defenses.fortitude = Math.floor(10+this.getLevel()/2) + Math.max(this.getAbilityMod('strength'), this.getAbilityMod('constitution')) + this.getClassAttributes()['fortitude'] + this.getRaceAttributes()['fortitude'];
        this.state._Defenses.reflex = Math.floor(10+this.getLevel()/2) + Math.max(this.getAbilityMod('dexterity'), this.getAbilityMod('intelligence')) + this.getClassAttributes()['reflex'] + this.getRaceAttributes()['reflex'];
        this.state._Defenses.will = Math.floor(10+this.getLevel()/2) + Math.max(this.getAbilityMod('wisdom'), this.getAbilityMod('charisma')) + this.getClassAttributes()['will'] + this.getRaceAttributes()['will'];
      } else {
        this.state._Defenses.armorClass = template.armorClass;
        this.state._Defenses.fortitude = template.fortitude;
        this.state._Defenses.reflex = template.reflex;
        this.state._Defenses.will = template.will;
      }
    }
  },
  METHODS: {
    getAC: function(){
      return this.state._Defenses.armorClass;
    },
    setAC: function(armorClass){
      this.state._Defenses.armorClass = Math.floor(10+this.getLevel()/2) + this.getClassAttributes()['armorClass'];
    },
    getFort: function(){
      return this.state._Defenses.fortitude;
    },
    setFort: function(fortitude){
      this.state._Defenses.fortitude = Math.floor(10+this.getLevel()/2) + Math.max(this.getAbilityMod('strength'), this.getAbilityMod('constitution')) + this.getClassAttributes()['fortitude'] + this.getRaceAttributes()['fortitude'];
    },
    getRef: function(){
      return this.state._Defenses.reflex;
    },
    setRef: function(reflex){
      this.state._Defenses.reflex = Math.floor(10+this.getLevel()/2) + Math.max(this.getAbilityMod('dexterity'), this.getAbilityMod('intelligence')) + this.getClassAttributes()['reflex'] + this.getRaceAttributes()['reflex'];
    },
    getWill: function(){
      return this.state._Defenses.will;
    },
    setWill: function(will){
      this.state._Defenses.will = Math.floor(10+this.getLevel()/2) + Math.max(this.getAbilityMod('wisdom'), this.getAbilityMod('charisma')) + this.getClassAttributes()['will'] + this.getRaceAttributes()['will'];
    },
  },
  LISTENERS: {
    'setDefenses': function(){
      this.setAC();
      this.setFort();
      this.setRef();
      this.setWill();
    }
  }
};

//******************************************
//Actions (Attacks, Minors, Movement)
//******************************************

export let BasicAttacker = {
  META:{
    mixinName: 'BasicAttacker',
    mixinGroupName: 'BasicAttackerGroup',
    stateNameSpace: '_BasicAttacker',
    stateModel: {
      basicDamage: 1
    },
    initialize: function(template){
      if (this.getMeleeWeapon){
        this.state._BasicAttacker.basicDamage = this.getMeleeWeapon().getDamage();
      } else {
        this.state._BasicAttacker.basicDamage = template.basicDamage;
      }
    }
  },
  METHODS: {
    getBasicDamage: function (){return this.state._BasicAttacker.basicDamage;},
    setBasicDamage: function (amt){this.state._BasicAttacker.basicDamage = amt;},
    surroundingAttack: function(){
      let ents = this.findSurroundingEnts();
      if (ents) {
        for (let ent in ents) {
          if (ent.name != 'tree'){
            Message.send('Attacked surrounding ents');
            ent.loseHp(this.getBasicDamage()/4);
          }
        }
      }
    },
    findSurroundingEnts: function(){
      ents = {}
      for (let i = -1; i <= 1; i++){
        for (let j = -1; j <= 1; j++){
          let tileInfo = this.getMap().getTargetPositionInfo(this.state.x*1 + i, this.state.y*1 + j);
          if (tileInfo.entity && tileInfo.entity != this) {
            ents[tileInfo.entity.getID()] = tileInfo.entity;
          }
        }
      }
      if (ents != {}) {
        return ents
      }
      return false;
    }
  },
  LISTENERS: {
    'attackEntity': function(evtData) {
      this.raiseMixinEvent('attacks', {actor:this, target:evtData.target})
      evtData.target.raiseMixinEvent('damaged', {src:this, damageAmount:this.getBasicDamage()});
      this.raiseMixinEvent('spendStandard');
    }
  }
};


//******************************************

export let PlayerAbilities = {
  META:{
    mixinName: 'PlayerAbilities',
    mixinGroupName: 'Abilities',
    stateNameSpace: '_PlayerAbilities',
    stateModel: {
      atWills: '',
      encounters: '',
      dailies: '',
      utilities: '',
    },
    initialize: function(template){
      this.state._PlayerAbilities.atWills = {};
      this.state._PlayerAbilities.encounters = {};
      this.state._PlayerAbilities.dailies = {};
      this.state._PlayerAbilities.utilities = {};

      this.state._PlayerAbilities.classAtWills = {};
      this.state._PlayerAbilities.levelEncounters = {};
      this.state._PlayerAbilities.levelDailies = {};
      this.state._PlayerAbilities.levelUtilities = {};

      this.state._PlayerAbilities.classAtWills['attacks'] = AtWills[this.getClass()].attacks;
      this.state._PlayerAbilities.levelEncounters['attacks'] = Encounters[this.getClass()][this.getLevel()].attacks;
      this.state._PlayerAbilities.levelDailies['attacks'] = Dailies[this.getClass()][this.getLevel()].attacks;
      this.state._PlayerAbilities.levelUtilities['attacks'] = Utilities[this.getClass()][this.getLevel()].attacks;


      for (let i = 0; i < AtWills[this.getClass()].attacks.length; i++) {
        this.state._PlayerAbilities.classAtWills[AtWills[this.getClass()].attacks[i]] = AtWills[this.getClass()][AtWills[this.getClass()].attacks[i]];
      }
    }
  },
  METHODS: {
    getClassAtWills: function() {
      return this.state._PlayerAbilities.classAtWills;
    },
    getLevelEncounters: function() {
      if (Encounters[this.getClass()][this.getLevel()].attacks) {
        for (let i = 0; i < Encounters[this.getClass()][this.getLevel()].attacks.length; i++) {
          this.state._PlayerAbilities.levelEncounters[Encounters[this.getClass()][this.getLevel()].attacks[i]] = Encounters[this.getClass()][this.getLevel()][Encounters[this.getClass()][this.getLevel()].attacks[i]];
        }
        return this.state._PlayerAbilities.levelEncounters;
      }
    },
    getLevelDailies: function() {
      if (Dailies[this.getClass()][this.getLevel()].attacks) {
        for (let i = 0; i < Dailies[this.getClass()][this.getLevel()].attacks.length; i++) {
          this.state._PlayerAbilities.levelDailies[Dailies[this.getClass()][this.getLevel()].attacks[i]] = Dailies[this.getClass()][this.getLevel()][Dailies[this.getClass()][this.getLevel()].attacks[i]];
        }
        return this.state._PlayerAbilities.levelDailies;
      }
    },
    getLevelUtilities: function() {
      if (Utilities[this.getClass()][this.getLevel()].attacks) {
        for (let i = 0; i < Utilities[this.getClass()][this.getLevel()].attacks.length; i++) {
          this.state._PlayerAbilities.LevelUtilities[Utilities[this.getClass()][this.getLevel()].attacks[i]] = Utilities[this.getClass()][this.getLevel()][Utilities[this.getClass()][this.getLevel()].attacks[i]];
        }
        return this.state._PlayerAbilities.levelUtilities;
      }
    },
    setAttacks: function(){
      for (let i = 0; i < AtWills[this.getClass()].attacks.length; i++) {
        if (this.isChosen(attack, AtWills[this.getClass()])) {
          this.state._PlayerAbilities.atWills[AtWills[this.getClass()].attacks[i]] = AtWills[this.getClass()][AtWills[this.getClass()].attacks[i]];
        }
      }
        for (let i = 1; i <= this.getLevel(); i++) {
        if (Encounters[this.getClass()][i].attacks) {
          for (let j = 0; j < Encounters[this.getClass()][i].attacks.length; j++) {
            if (this.isChosen(Encounters[this.getClass()][i].attacks[j]), Encounters[this.getClass()][i]) {
              this.state._PlayerAbilities.encounters[this.getClass()][i].attacks[j] = Encounters[this.getClass()][i][Encounters[this.getClass()][this.getLevel()].attacks[j]];
            }
          }
        }
      if (Dailies[this.getClass()][i].attacks) {
        for (let j = 0; j < Dailies[this.getClass()][i].attacks.length; j++) {
          if (this.isChosen(Dailies[this.getClass()][i].attacks[j]), Dailies[this.getClass()][i]) {
            this.state._PlayerAbilities.dailies[this.getClass()][i].attacks[j] = Dailies[this.getClass()][i][Dailies[this.getClass()][this.getLevel()].attacks[j]];
          }
        }
      }
        if (Utilities[this.getClass()][i].attacks) {
          for (let j = 0; j < Utilities[this.getClass()][i].attacks.length; j++) {
            if (this.isChosen(Utilities[this.getClass()][i].attacks[j]), Utilities[this.getClass()][i]) {
              this.state._PlayerAbilities.utilities[this.getClass()][i].attacks[j] = Utilities[this.getClass()][i][Utilities[this.getClass()][this.getLevel()].attacks[j]];
            }
          }
        }
      }
    },
    isChosen: function(attack, place) {
      return place[attack].chosen;
    },
    setChoice: function(attack, place, choice) {
      place[attack].chosen = choice;
    },
    getAtWills: function() {
      return this.state._PlayerAbilities.atWills;
    },
    getEncounters: function() {
      return this.state._PlayerAbilities.encounters;
    },
    getDailies: function() {
      return this.state._PlayerAbilities.dailies;
    },
    getUtilities: function() {
      return this.state._PlayerAbilities.utilities;
    }
  },
  LISTENERS: {
    'getCurrentAttacks': function(evtData) {
      if (evtData.type == 'atWills') {
        return this.getAtWills();
      }
      if (evtData.type == 'encounters') {
        return this.getEncounters();
      }
      if (evtData.type == 'dailies') {
        return this.getDailies();
      }
      if (evtData.type == 'utilities') {
        return this.getUtilities();
      }
    },
    'chooseAttack': function(evtData) {
      this.setChoice(evtData.attack, evtData.place, true);
      this.setAttacks();
      this.raiseMixinEvent('choosingAttack', {attack: evtData.attack});
    }
  }
};


//******************************************

// export let ActorWanderer = {
//   META:{
//     mixinName: 'ActorWanderer',
//     mixinGroupName: 'Wanderer',
//     stateNameSpace: '_ActorWanderer',
//     stateModel: {
//       allowedActionDuration: 3,
//       spentActions: 0,
//       actingState: false
//     },
//     initialize: function(template){
//       this.state._ActorWanderer.allowedActionDuration = template.allowedActionDuration;
//       SCHEDULER.add(this, true);
//       console.log('entity added');
//     }
//   },
//   METHODS: {
//     getAllowedActionDuration: function(){
//       return this.state._ActorWanderer.allowedActionDuration;
//     },
//     setAllowedActionDuration: function(amt){
//       this.state._ActorWanderer.allowedActionDuration = amt;
//     },
//     getSpentActions: function(){
//       return this.state._ActorWanderer.spentActions;
//     },
//     setSpentActions: function(amt){
//       this.state._ActorWanderer.spentActions = amt;
//     },
//     findNearbyAvatar: function(){
//       for (let i = -1; i <= 1; i++){
//         for (let j = -1; j <= 1; j++){
//           let tileInfo = this.getMap().getTargetPositionInfo(this.state.x*1 + i, this.state.y*1 + j);
//           if (tileInfo.entity && tileInfo.entity.state.name == "avatar") {
//             console.log('avatar found');
//             return [true, i, j];
//           }
//         }
//       }
//       return [false];
//     },
//     findNearbyAlly: function(){
//       for (let i = -1; i <= 1; i++){
//         for (let j = -1; j <= 1; j++){
//           let tileInfo = this.getMap().getTargetPositionInfo(this.state.x*1 + i, this.state.y*1 + j);
//           if (tileInfo.entity && tileInfo.entity.state.name != "avatar" && i != 0 && j != 0) {
//             return [true, i, j];
//           }
//         }
//       }
//       return [false];
//     },
//     randomMove: function(){
//       if (this.getRangedDamage && this.getRangedDamage != 0) {
//         let directions = ['w','s','a','d']
//         for (let direction in directions){
//           let ent = this.getMap().findClosestEntInLine(ent, direction)
//           if (ent){
//             if (ent.getName() == 'avatar' || ent.getName() == 'tree'){
//               this.raiseMixinEvent('rangedAttack', {actor: this, target: ent});
//             }
//           }
//         }
//       }
//       if (this.getMagicDamage && this.getMagicDamage != 0) {
//         let directions = ['w','s','a','d']
//         for (let direction in directions){
//           let ent = this.getMap().findClosestEntInLine(ent, direction)
//           if (ent){
//             if (ent.getName() == 'avatar' || ent.getName() == 'tree'){
//               this.raiseMixinEvent('magicAttack', {actor: this, target: ent, damageAmount: this.getMagicDamage()});
//               this.raiseMixinEvent('usedMag', {manaUsed: 8})
//             }
//           }
//         }
//       }
//       let avatar = this.findNearbyAvatar();
//       let ally = this.findNearbyAlly()
//       if (avatar[0]){
//         this.tryWalk(avatar[1], avatar[2]);
//       } else if (ally[0]){
//         this.tryWalk(-ally[1], -ally[2]);
//       } else {
//         let num = ROT.RNG.getUniform();
//         if (num < 0.25) {
//           this.tryWalk(1, 0);
//         } else if (0.25 <= num < 0.5) {
//           this.tryWalk(-1, 0);
//         } else if (0.5 <= num < 0.75){
//           this.tryWalk(0, 1);
//         } else {
//           this.tryWalk(0, -1);
//         }
//       }
//     },
//     act: function() {
//       this.randomMove();
//     }
//   },
//   LISTENERS: {
//     'spendAction': function(evtData) {
//       evtData.spender.state._ActorWanderer.spentActions += evtData.spent;
//       //console.log(evtData.spender.state._ActorWanderer.spentActions);
//       if (evtData.spender.state._ActorWanderer.spentActions >= evtData.spender.getAllowedActionDuration()){
//         if (this.getMP){
//           this.gainMp(1);
//         }
//         SCHEDULER.next();
//       }
//     }
//   }
// };

//******************************************

export let ActorPlayer = {
  META:{
    mixinName: 'ActorPlayer',
    mixinGroupName: 'Player',
    stateNameSpace: '_ActorPlayer',
    stateModel: {
      standard: 1,
      move: 1,
      speed: 1,
      initiative: 0,
      minor: 1,
    },
    initialize: function(){
      SCHEDULER.add(this, true);
      this.state._ActorPlayer.speed = this.getRaceAttributes()['speed']
      this.state._ActorPlayer.initiative = this.getDex() + Math.floor(this.getLevel()/2)
    }
  },
  METHODS: {
    getStandard: function() {
      return this.state._ActorPlayer.standard;
    },
    setStandard: function(num) {
      this.state._ActorPlayer.standard = num;
    },
    addStandard(num) {
      this.state._ActorPlayer.standard += num;
    },
    getMove: function() {
      return this.state._ActorPlayer.move;
    },
    setMove: function(num) {
      this.state._ActorPlayer.move = num;
    },
    addMove(num) {
      this.state._ActorPlayer.move += num;
    },
    getSpeed: function() {
      return this.state._ActorPlayer.speed;
    },
    setSpeed: function(num) {
      this.state._ActorPlayer.speed = num;
    },
    getMinor: function() {
      return this.state._ActorPlayer.minor;
    },
    setMinor: function(num) {
      this.state._ActorPlayer.minor = num;
    },
    addMinor(num) {
      this.state._ActorPlayer.minor += num;
    },
    getInit: function() {
      return this.state._ActorPlayer.initiative;
    },
    setInit: function() {
      this.state._ActorPlayer.initiative = this.getDex() + Math.floor(this.getLevel()/2);
    },
    act: function() {
      Message.send(this.getName() + '\'s turn');
      return false;
    }
  },
  LISTENERS: {
    'spendStandard': function() {
      this.addStandard(-1);
      return true;
    },
    'spendMove': function() {
      this.addMove(-1);
      return true;
    },
    'spendMinor': function() {
      this.addMinor(-1);
      return true;
    },
    'resetActions': function() {
      this.setStandard(1);
      this.setMove(1);
      this.setMinor(1);
      return true;
    },
    'nextTurn': function() {
      SCHEDULER.next();
    }
  }
};

//******************************************
//Race and Class
//******************************************

export let RacePlayer = {
  META:{
    mixinName: 'RacePlayer',
    mixinGroupName: 'Race',
    stateNameSpace: '_RacePlayer',
    stateModel: {
      race: 'human'
    },
    initialize: function(template){
      this.state._RacePlayer.race = template.race;
    }
  },
  METHODS: {
    getRace: function() {
      return this.state._RacePlayer.race;
    },
    getRaceAttributes: function() {
      return Races[this.getRace()];
    }
  },
};

export let ClassPlayer = {
  META:{
    mixinName: 'ClassPlayer',
    mixinGroupName: 'Class',
    stateNameSpace: '_ClassPlayer',
    stateModel: {
      class: 'fighter'
    },
    initialize: function(template){
      this.state._ClassPlayer.class = template.class;
    }
  },
  METHODS: {
    getClass: function() {
      return this.state._ClassPlayer.class;
    },
    getClassAttributes: function() {
      return Classes[this.getClass()];
    }
  },
};
