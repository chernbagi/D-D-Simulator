import {Message} from './message.js';
import {MapMaker} from './map.js';
import {DisplaySymbol} from'./display_symbol.js';
import {DATASTORE, clearDataStore} from './datastore.js';
import {EntityFactory} from './entities.js';
import {StartupInput, BattleInput, EndInput, HCInput, PersistenceInput, LevelInput, ControlInput, AimInput, InfoInput} from './key_bind.js';
import {AtWills, Encounters, Dailies, Utilities} from './attacks.js'
import {LevelsData} from './levels.js'
import {SCHEDULER} from './timing.js';
import ROT from 'rot-js';

class UIMode {
  constructor(Game){
    console.log("created " + this.constructor.name);
    this.Game = Game;
  }
  enter(){
    console.log("entered " + this.constructor.name);
  }
  exit(){
    console.log("exited " + this.constructor.name);
  }
  handleInput(eventType, evt){
    console.log("handling " + this.constructor.name);
    console.log(`event type is ${eventType}`)
    return(true)
  }
   render(display){
    console.log("redering " + this.constructor.name);
    display.drawText(2, 2, "redering " + this.constructor.name);
  }
  renderAvatar(display){
    display.clear();
  }
  renderInfo(display){
    display.clear();
  }
}

export class StartupMode extends UIMode {
  enter () {
    console.log('DATASTORE')
    console.dir(DATASTORE);
    clearDataStore();
    Message.clear();
    console.dir(this);
    if (!this.startupHandler){
      this.startupHandler = new StartupInput(this.Game);
    }
  }
  render(display) {
    display.clear();
    display.drawText(30, 6, "Hit any key to begin");
    display.drawText(33, 3, "D&D Simulator");
  }
  handleInput(eventType, evt){
    return this.startupHandler.handleInput(eventType, evt);
  }
}

export class BattleMode extends UIMode {
  constructor(Game){
    super(Game);
    this.state = {
      mapID: '',
      cameraMapX: '',
      cameraMapY: '',
      level: 1,
      options: false
    };
  }

  enter(){
    if (!this.battleHandler){
      this.battleHandler = new BattleInput(this.Game);
    }
    if (!this.infoHandler){
      this.infoHandler = new InfoInput(this.Game);
    }
    // if (!this.Game.timer.hasStarted()){
    //   this.Game.timer.start();
    // } else {
    //   this.Game.timer.restart();
    // }
  }

  toJSON() {
    return JSON.stringify(this.state);
  }
  restoreFromState(stateDataString){
    this.state = JSON.parse(stateDataString);
  }

  setupNewGame() {
    SCHEDULER.clear();
    this.state.level = 0;
    let m = MapMaker({xdim: 40, ydim: 12});
    this.state.mapID = m.getID();
    m.build();
    this.state.cameraMapX = 0;
    this.state.cameraMapY = 0;
    let a = EntityFactory.create('Example');
    this.state.avatarID = a.getID();
    m.addEntityAtRandomPosition(a);
    let b = EntityFactory.create('Example');
    m.addEntityAtRandomPosition(b);
    console.log('battle mode - new game started');
    this.moveCameratoAvatar();
    Message.clearCache();
    DATASTORE.GAME = this.Game;
  }


  render(display) {
    display.clear();
    DATASTORE.MAPS[this.state.mapID].render(display, this.state.cameraMapX, this.state.cameraMapY);
  }

  renderAvatar(display){
    display.clear()
    display.drawText(0, 0, this.getAvatar().getName());
    display.drawText(0, 2, "Location: " + this.getAvatar().getX() + ", " + this.getAvatar().getY());
    display.drawText(0, 3, "Level: " + this.getAvatar().getLevel());
    display.drawText(0, 4, "XP: " + this.getAvatar().getXP());
    display.drawText(0, 5, "Max HP: " + this.getAvatar().getMaxHp());
    display.drawText(0, 6, "Current HP: " + this.getAvatar().getHp());
    display.drawText(0, 7, "Surges: " + this.getAvatar().getSurges());
    display.drawText(0, 8, "Speed: " + this.getAvatar().getSpeed());
    display.drawText(0, 9, "Strength: " + this.getAvatar().getStr());
    display.drawText(0, 10, "Constitution: " + this.getAvatar().getCon());
    display.drawText(0, 11, "Dexterity: " + this.getAvatar().getDex());
    display.drawText(0, 12, "Intelligence: " + this.getAvatar().getInt());
    display.drawText(0, 13, "Wisdom: " + this.getAvatar().getWis());
    display.drawText(0, 14, "Charisma: " + this.getAvatar().getCha());
    display.drawText(0, 15, "Armor Class: " + this.getAvatar().getAC());
    display.drawText(0, 16, "Fortitude: " + this.getAvatar().getFort());
    display.drawText(0, 17, "Reflex: " + this.getAvatar().getRef());
    display.drawText(0, 18, "Will: " + this.getAvatar().getWill());
    display.drawText(0, 19, "Initiative: " + this.getAvatar().getInit());
  }
  renderInfo(display) {
    if (!this.state.options){
      display.clear();
      display.drawText(0, 0, "What will you do?");
      display.drawText(0, 1, "Move - wsad");
      display.drawText(0, 2, "Attack - z");
      display.drawText(0, 3, "Get Info - i");
      display.drawText(0, 4, "Help Mode - h");
      display.drawText(0, 5, "Check Messages - m");
      display.drawText(0, 6, "End Turn - Enter");
    }

  }
  renderInfoOptions(display) {
    display.clear();
    display.drawText(0, 0, "What info do you want?");
    display.drawText(0, 1, "Abilities - 1");
    display.drawText(0, 5, "Return to game - Esc");
    this.state.options = true;
  }
  renderAbilities(display) {
    display.clear();
    let line = 0;
    display.drawText(0, line, this.getAvatar().getClass());
    line += 1;
    display.drawText(0, line, "At Will Attacks")
    for (let attack in this.getAvatar().getAtWills()) {
      display.drawText(0, line, this.getAvatar().getAtWills()[attack].name);
      line += 1;
      display.drawText(0, line, this.getAvatar().getAtWills()[attack].blurb);
      line += Math.floor(this.getAvatar().getAtWills()[attack].blurb.length/20 + 1);
    }
    display.drawText(0, line, "Encounter Attacks")
    for (let attack in this.getAvatar().getEncounters()) {
      display.drawText(0, line, this.getAvatar().getEncounters()[attack].name);
      line += 1;
      display.drawText(0, line, this.getAvatar().getEncounters()[attack].blurb);
      line += Math.floor(this.getAvatar().getEncounters()[attack].blurb.length/20 + 1);
    }
    display.drawText(0, line, "Dailies Attacks")
    for (let attack in this.getAvatar().getDailies()) {
      display.drawText(0, line, this.getAvatar().getDailies()[attack].name);
      line += 1;
      display.drawText(0, line, this.getAvatar().getDailies()[attack].blurb);
      line += Math.floor(this.getAvatar().Dailies()[attack].blurb.length/20 + 1);
    }
    display.drawText(0, line, "Utilities Attacks")
    for (let attack in this.getAvatar().getUtilities()) {
      display.drawText(0, line, this.getAvatar().getUtilities()[attack].name);
      line += 1;
      display.drawText(0, line, this.getAvatar().getUtilities()[attack].blurb);
      line += Math.floor(this.getAvatar().getUtilities()[attack].blurb.length/20 + 1);
    }
  }
  // endGame(){
  //   if (this.getAvatar()) {
  //     if (this.getAvatar().endGame()) {
  //       this.Game.switchMode('win');
  //     } else {
  //       this.Game.switchMode('lose');
  //     }
  //   } else {
  //     if (this.score > 500){
  //       this.Game.switchMode('win');
  //     } else {
  //       this.Game.switchMode('lose');
  //     }
  //   }
  // }
  handleInput(eventType, evt){
    let eventOutput = this.battleHandler.handleInput(eventType, evt);
    console.log(eventOutput);
    if (eventOutput == 'w') {
      this.moveAvatar(0, -1);
      return true;
    }
    if (eventOutput == 's') {
      this.moveAvatar(0, 1);
      return true;
    }
    if (eventOutput == 'a') {
      this.moveAvatar(-1, 0);
      return true;
    }
    if (eventOutput == 'd') {
      this.moveAvatar(1, 0);
      return true;
    }
    if (eventOutput == 'z') {
      this.Game.switchMode('attack');
      return true;
    }
    if (eventOutput == 'm') {
      this.Game.switchMode('cache');
      return true;
    }
    if (eventOutput == 'h') {
      this.Game.switchMode('help');
      return true;
    }
    if (eventOutput == 'Enter') {
      Message.send('Ending' + this.getAvatar().getName() + '\'s turn.')
      //this.endTurn();
      return true;
    }
    if (eventOutput == 'i') {
      this.renderInfoOptions(this.Game.display.info.o);
      let secondaryOutput = this.infoHandler.handleInput(eventType, evt);
      console.log(secondaryOutput);
      if (secondaryOutput == '1') {
        this.renderAbilities(this.Game.display.info.o);
        return true;
      }
      if (secondaryOutput =='b') {
        this.state.options = false;
        this.renderInfo(this.Game.display.info.o);
        return true;
      }
    }
    return eventOutput;
  }
  moveCamera(dx, dy){
    this.state.cameraMapX += dx;
    this.state.cameraMapY += dy;
    return true;
  }
  moveAvatar(dx, dy) {
    if(this.getAvatar().tryWalk(dx, dy)) {
      this.moveCameratoAvatar();
      return true;
    }
    return false;
  }
  moveCameratoAvatar(){
    this.state.cameraMapX = this.getAvatar().getX();
    this.state.cameraMapY = this.getAvatar().getY();
  }
  getAvatar() {
    return DATASTORE.ENTITIES[this.state.avatarID];
  }
  // makeEntites(num, map, EntityFactory){
  //   for (let i = 0; i < 3; i++) {
  //     map.addEntityAtRandomPosition(EntityFactory.create('tree'));
  //   }
  //   for (let i = 0; i < num; i++) {
  //     map.addEntityAtRandomPosition(EntityFactory.create('soldier'));
  //   }
  //   if (this.state.level >= 5) {
  //     for (let i = 0; i < num / 5; i++){
  //       map.addEntityAtRandomPosition(EntityFactory.create('centaurion'));
  //     }
  //   }
  //   if (this.state.level >= 15) {
  //     for (let i = 0; i < num / 10; i++){
  //       map.addEntityAtRandomPosition(EntityFactory.create('general'));
  //     }
  //   }
  // }

  exit(){
    //this.Game.timer.pause()
  }
}
export class WinMode extends UIMode {
  enter(){
    Message.send("hit r to try again!")
    if (!this.endHandler){
      this.endHandler = new EndInput(this.Game);
    }
  }
  render(display) {
    display.clear();
    display.drawText(37, 3, "YOU")
    display.drawText(37, 4, "WIN")
  }
  handleInput(eventType, evt){
    return this.endHandler.handleInput(eventType, evt);
  }
}

export class LoseMode extends UIMode {
  enter(){
    Message.send("hit r to try again!")
    if (!this.endHandler){
      this.endHandler = new EndInput(this.Game);
    }
  }
  render(display) {
    display.clear();
    display.drawText(37, 3, "YOU");
    display.drawText(37, 4, "LOSE");
  }
  enter(){
    Message.send("hit r to play again!")
  }
  handleInput(eventType, evt){
    this.endHandler = new EndInput(this.Game);
    return this.endHandler.handleInput(eventType, evt);
  }
}

export class CacheMode extends UIMode {
  enter(){
    Message.send("hit escape to return to your game")
    if (!this.hcHandler){
      this.hcHandler = new HCInput(this.Game);
    }
  }
  render(display){
    display.clear();
    display.drawText(1, 1, "Hit esc to exit");
    display.drawText(1, 2, Message.cache)
  }
  handleInput(eventType, evt){
    return this.hcHandler.handleInput(eventType, evt);
  }
}

export class HelpMode extends UIMode {
  enter() {
    if (!this.hcHandler){
      this.hcHandler = new HCInput(this.Game);
    }
  }
  render(display) {
    display.clear();
    display.drawText(35, 0, "Help Mode:");
    display.drawText(0, 2, "Use wsad to move.");
  }
  handleInput(eventType, evt){
    return this.hcHandler.handleInput(eventType, evt);
  }
}

export class PersistenceMode extends UIMode {
  enter(){
    Message.send("hit escape to return to your game")
    if (!this.persistenceHandler){
      this.persistenceHandler = new PersistenceInput(this.Game);
    }
  }
  render(display){
    display.clear();
    display.drawText(30, 3, "N for new game");
    display.drawText(30, 4, "S to save game");
    display.drawText(30, 5, "L to load game");
  }
  handleInput(eventType, evt){
    let eventOutput = this.persistenceHandler.handleInput(eventType, evt);
    if (eventOutput == "s" || eventOutput == "S") {
      this.handleSave();
      return true;
    }
    if (eventOutput == "l" || eventOutput == "L"){
      this.handleLoad();
      return true;
    }
    return eventOutput;
  }

  handleSave() {
    if (! this.localStorageAvailable()) {
        return;
    }
    window.localStorage.setItem('savestate', JSON.stringify(DATASTORE));

    console.log('save game')
    this.Game.hasSaved = true;
    Message.send('Game saved');
    this.Game.switchMode('play');
  }

  handleLoad() {
    if (! this.localStorageAvailable()) {
        return;
    }

    let restorationString = window.localStorage.getItem('savestate')
    let state = JSON.parse(restorationString);
    console.dir(restorationString);
    clearDataStore();
    DATASTORE.ID_SEQ = state.ID_SEQ;
    DATASTORE.LEVEL = state.LEVEL;
    DATASTORE.TIME = state.TIME;
    console.log(state.GAME);
    if (!state.GAME.rseed){
      DATASTORE.GAME = JSON.parse(state.GAME);
      console.log(DATASTORE.GAME.playModeState);
      DATASTORE.GAME.playModeState = JSON.parse(DATASTORE.GAME.playModeState);
      console.log(DATASTORE.GAME.playModeState);
    } else {
      DATASTORE.GAME = state.GAME
    }

    for (let mapID in state.MAPS){
      let mapData = JSON.parse(state.MAPS[mapID]);
      DATASTORE.MAPS[mapID] = MapMaker(mapData); //mapData.xdim, mapData.ydim, mapData.setRngState);
      this.Game.modes.battle.state.mapID = mapID;
      DATASTORE.MAPS[mapID].build();
    }
    for (let entID in state.ENTITIES){
        DATASTORE.ENTITIES[entID] = JSON.parse(state.ENTITIES[entID]);
        let ent = EntityFactory.create(DATASTORE.ENTITIES[entID].name);

        let entState = JSON.parse(state.ENTITIES[entID])
        if (entState._PlayerStats) {
          ent.state._PlayerStats.strength = entState._PlayerStats.strength;
          ent.state._PlayerStats.constitution = entState._PlayerStats.constitution;
          ent.state._PlayerStats.dexterity = entState._PlayerStats.dexterity;
          ent.state._PlayerStats.intelligence = entState._PlayerStats.intelligence;
          ent.state._PlayerStats.wisdom = entState._PlayerStats.wisdom;
          ent.state._PlayerStats.charisma = entState._PlayerStats.charisma;
        }
        if (entState._HitPoints) {
          ent.state._HitPoints.maxHp = entState._HitPoints.maxHp;
          ent.state._HitPoints.curHp = entState._HitPoints.curHp;
        }
        if (entState._TimeTracker) {
          ent.state._TimeTracker.timeTaken = entState._TimeTracker.timeTaken;
        }
        if (entState._RangedAttackerEnemy) {
          ent.state._RangedAttackerEnemy.rangedDamage = entState._RangedAttackerEnemy.rangedDamage;
          ent.state._RangedAttackerEnemy.magicDamage = entState._RangedAttackerEnemy.magicDamage;
        }
        if (entState._PlayerAbilities) {
          ent.state._PlayerAbilities.atWills = entState._PlayerAbilities.atWills;
          ent.state._PlayerAbilities.encounters = entState._PlayerAbilities.encounters;
          ent.state._PlayerAbilities.dailies = entState._PlayerAbilities.dailies;
          ent.state._PlayerAbilities.utilities = entState._PlayerAbilities.utilities;
        }
        if (entState._Defenses) {
          ent.state._Defenses.armorClass = entState._Defenses.armorClass;
          ent.state._Defenses.fortitude = entState._Defenses.fortitude;
          ent.state._Defenses.reflex = entState._Defenses.reflex;
          ent.state._Defenses.utilities = entState._Defenses.utilities;
        }
        if (entState._BasicAttacker) {
          ent.state._BasicAttacker.meleeDamage = entState._BasicAttacker.meleeDamage;
        }
        if (entState._ExpPlayer) {
          ent.state._ExpPlayer.exp = entState._ExpPlayer.exp;
        }
        if (entState._Levels) {
          ent.state._Levels.level = entState._Levels.level;
        }
        SCHEDULER.remove(state.ENTITIES[entID]);
        DATASTORE.MAPS[Object.keys(DATASTORE.MAPS)[0]].addEntityAt(ent, DATASTORE.ENTITIES[entID].x, DATASTORE.ENTITIES[entID].y);
        delete ent.getMap().state.mapPostoEntityID[ent.getMap().state.entityIDtoMapPos[ent.getID()]];
        delete ent.getMap().state.entityIDtoMapPos[ent.getID()];
        SCHEDULER.remove(ent);
        DATASTORE.ENTITIES[entID] = ent;
        delete DATASTORE.ENTITIES[ent.getID()]
        DATASTORE.ENTITIES[entID].state.id = entID;
        let pos = `${DATASTORE.ENTITIES[entID].state.x},${DATASTORE.ENTITIES[entID].state.y}`;
        ent.getMap().state.mapPostoEntityID[pos] = entID;
        ent.getMap().state.entityIDtoMapPos[ent.getID()] = pos;
        SCHEDULER.add(ent);
        if (ent.name == 'avatar') {
          this.Game.modes.battle.state.avatarID = ent.getID();
        }
    }
    console.log('post-load datastore');
    console.dir(DATASTORE);
    this.Game.switchMode('play');
  }
  localStorageAvailable() {
    // NOTE: see https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    try {
      var x = '__storage_test__';
      window.localStorage.setItem( x, x);
      window.localStorage.removeItem(x);
      return true;
    }
    catch(e) {
      Message.send('Sorry, no local data storage is available for this browser so game save/load is not possible');
      return false;
    }
  }
}

export class ControlMode extends UIMode {
  enter() {
    if (!this.controlHandler){
      this.controlHandler = new ControlInput(this.Game);
    }
  }
  render(display) {
    display.clear();
    display.drawText(0, 0, "Use wsad to move. ");
    display.drawText(0, 1, "To execute an attack,press z and choose your action.");
    display.drawText(28, 15, "Press any key to continue");
  }
  handleInput(eventType, evt){
    return this.controlHandler.handleInput(eventType, evt);
  }
}

export class LevelMode extends UIMode {
  enter(){
    console.log('level')
    if (!this.levelHandler){
      this.levelHandler = new LevelInput(this.Game);
    }
    this.getAvatar().raiseMixinEvent('levelUp')
    this.eventOutput = false;
    this.evtOut = '';
    this.allowedAtWills = this.getAvatar().getLevelInfo(this.getAvatar().getLevel())['atWill'];
    this.allowedEncounters = this.getAvatar().getLevelInfo(this.getAvatar().getLevel())['encounter'];
    this.allowedDailies = this.getAvatar().getLevelInfo(this.getAvatar().getLevel())['daily'];
    this.allowedUtilities= this.getAvatar().getLevelInfo(this.getAvatar().getLevel())['utility'];

  }
  getAvatar() {
    return DATASTORE.ENTITIES[this.Game.modes.battle.state.avatarID];
  }
  handleInput(eventType, evt){
    let eventOutput = this.evtOut;
    if (eventType == 'keyup') {
      let secondaryOutput = '';
      if (this.eventOutput) {
        secondaryOutput = this.levelHandler.handleInput(eventType, evt)
      } else {
        eventOutput = this.levelHandler.handleInput(eventType, evt);
        this.evtOut = eventOutput;
        this.eventOutput = true;
      }
      if (this.allowedAtWills != 0) {
        if (eventOutput == '1') {
          this.renderAtWills(this.Game.display.info.o)
          if (secondaryOutput == '1' || secondaryOutput == '2' || secondaryOutput == '3' || secondaryOutput == '4' || secondaryOutput == '5' || secondaryOutput == '6') {
            if (this.getAvatar().isChosen(this.getAvatar().getClassAtWills()['attacks'][secondaryOutput*1-1], AtWills[this.getAvatar().getClass()])) {
              Message.send('You have already selected this power');
              this.eventOutput = false;
              return true;
            }
            this.getAvatar().raiseMixinEvent('chooseAttack', {attack: this.getAvatar().getClassAtWills()['attacks'][secondaryOutput*1-1], place: AtWills[this.getAvatar().getClass()]});
            this.allowedAtWills -= 1;
            this.eventOutput = false;
            return true;
          }
          if (secondaryOutput == 'b') {
            this.renderInfo(this.Game.display.info.o);
            this.eventOutput = false;
            return true;
          }
        }
      } else if (this.allowedAtWills == 0 && eventOutput == '1') {
        Message.send('You have selected all the at will powers allowed.');
        this.eventOutput = false;
      }
      if (this.allowedEncounters != 0) {
        if (eventOutput == '2') {
          this.renderEncounters(this.Game.display.info.o)
          if (secondaryOutput == '1' || secondaryOutput == '2' || secondaryOutput == '3' || secondaryOutput == '4' || secondaryOutput == '5' || secondaryOutput == '6') {
            if (this.getAvatar().isChosen(this.getAvatar().getLevelEncounters()['attacks'][secondaryOutput*1-1], Encounters[this.getAvatar().getClass()][this.getAvatar().getLevel()])) {
              Message.send('You have already selected this power');
              this.eventOutput = false;
              return true;
            }
            this.getAvatar().raiseMixinEvent('chooseAttack', {attack: this.getAvatar().getLevelEncounters()['attacks'][secondaryOutput*1-1], place: Encounters[this.getAvatar().getClass()][this.getAvatar().getLevel()]});
            this.allowedEncounters -= 1;
            this.eventOutput = false;
            return true;
          }
          if (secondaryOutput == 'b') {
            this.renderInfo(this.Game.display.info.o);
            this.eventOutput = false;
            return true;
          }
        }
      } else if (this.allowedEncounters == 0 && eventOutput == '2') {
        Message.send('You have selected all the encounter powers allowed.');
        this.eventOutput = false;
        return true;
      }
      if (this.allowedDailies != 0) {
        if (eventOutput == '3') {
          this.renderDailies(this.Game.display.info.o)
          if (secondaryOutput == '1' || secondaryOutput == '2' || secondaryOutput == '3' || secondaryOutput == '4' || secondaryOutput == '5' || secondaryOutput == '6') {
            if (this.getAvatar().isChosen(this.getAvatar().getLevelDailies()['attacks'][secondaryOutput*1-1], Dailies[this.getAvatar().getClass()][this.getAvatar().getLevel()])) {
              Message.send('You have already selected this power');
              this.eventOutput = false;
              return true;
            }
            this.getAvatar().raiseMixinEvent('chooseAttack', {attack: this.getAvatar().getLevelDailies()['attacks'][secondaryOutput*1-1], place: Dailies[this.getAvatar().getClass()][this.getAvatar().getLevel()]});
            this.allowedDailies -= 1;
            this.eventOutput = false;
            return true;
          }
          if (secondaryOutput == 'b') {
            this.renderInfo(this.Game.display.info.o);
            this.eventOutput = false;
            return true;
          }
        }
      } else if (this.allowedDailies == 0 && eventOutput == '3') {
        Message.send('You have selected all the daily powers allowed.');
        this.eventOutput = false;
        return true;
      }
      if (this.allowedUtilities != 0) {
        if (eventOutput == '4') {
          this.renderUtilities(this.Game.display.info.o)
          if (secondaryOutput == '1' || secondaryOutput == '2' || secondaryOutput == '3' || secondaryOutput == '4' || secondaryOutput == '5' || secondaryOutput == '6') {
            if (this.getAvatar().isChosen(this.getAvatar().getLevelUtilites()['attacks'][secondaryOutput*1-1], Utilites[this.getAvatar().getClass()][this.getAvatar().getLevel()])) {
              Message.send('You have already selected this power');
              this.eventOutput = false;
              return true;
            }
            this.getAvatar().raiseMixinEvent('chooseAttack', {attack: this.getAvatar().getLevelUtilites()['attacks'][secondaryOutput*1-1], place: Utilites[this.getAvatar().getClass()][this.getAvatar().getLevel()]});
            this.allowedUtilities -= 1;
            this.eventOutput = false;
            return true;
          }
          if (secondaryOutput == 'b') {
            this.renderInfo(this.Game.display.info.o);
            this.eventOutput = false;
            return true;
          }
        }
      } else if (this.allowedUtilities == 0 && eventOutput == '4') {
        Message.send('You have selected all the utility powers allowed.');
        this.eventOutput = false;
        return true;
      }
      if (eventOutput == '5') {
        this.renderStats(this.Game.display.info.o);
        if (this.getAvatar().getSP() != 0) {
          Message.send('Choose 2 stats to add a point to')
          if (secondaryOutput == '1') {
            this.getAvatar().addStr(1);
            this.getAvatar().addSP(-1);
            Message.send('1 Strength Point Added');
            this.eventOutput = false;
            return true;
          }
          if (secondaryOutput == '2') {
            this.getAvatar().addCon(1);
            this.getAvatar().setMaxHp((this.getAvatar().getVit() + (this.getAvatar().getLevel() - 1)));
            this.getAvatar().addSP(-1);
            Message.send('1 Constitution Point Added');
            this.eventOutput = false;
            return true;
          }
          if (secondaryOutput == '3') {
            this.getAvatar().addDex(1);
            this.getAvatar().setInit();
            this.getAvatar().addSP(-1);
            Message.send('1 Dexterity Point Added');
            this.eventOutput = false;
            return true;
          }
          if (secondaryOutput == '4') {
            this.getAvatar().addInt(1);
            this.getAvatar().setMaxHp((this.getAvatar().getVit() + (this.getAvatar().getLevel() - 1)));
            this.getAvatar().addSP(-1);
            Message.send('1 Intelligence Point Added');
            this.eventOutput = false;
            return true;
          }
          if (secondaryOutput == '5') {
            this.getAvatar().addWis(1);
            this.getAvatar().addSP(-1);
            Message.send('1 Wisdom Point Added');
            this.eventOutput = false;
            return true;
          }
          if (secondaryOutput == '6') {
            this.getAvatar().addCha(1);
            this.getAvatar().addSP(-1);
            Message.send('1 Charisma Point Added');
            this.eventOutput = false;
            return true;
          }
        } else if (secondaryOutput == '1' || secondaryOutput == '2' || secondaryOutput == '3' || secondaryOutput == '4' || secondaryOutput == '5' || secondaryOutput == '6') {
          Message.send('You have no stat points left to use.')
        }
        if (secondaryOutput == 'b') {
          this.renderInfo(this.Game.display.info.o);
          this.eventOutput = false;
          return true;
        }
      }
      if (eventOutput == '6') {
        if (secondaryOutput == 'b') {
          this.renderInfo(this.Game.display.info.o);
          this.eventOutput = false;
          return true;
        }
      }
      if (eventOutput == 'hello!') {
        this.eventOutput = false;
        return true;
      }
    }
  }
  renderAtWills(display) {
    display.clear();
    let line = 0;
    let abilityNum =  1;
    display.drawText(0, line, "At Wills")
    for (let attack in this.getAvatar().getClassAtWills()) {
      if (attack != 'attacks') {
        display.drawText(0, line, abilityNum + " - " + this.getAvatar().getClassAtWills()[attack].name);
        line += 1;
        display.drawText(0, line,  this.getAvatar().getClassAtWills()[attack].blurb);
        line += Math.floor(this.getAvatar().getClassAtWills()[attack].blurb.length/20 + 1);
        abilityNum += 1;
      }
    }
  }
  renderEncounters(display) {
    display.clear();
    let line = 0;
    let abilityNum =  1;
    display.drawText(0, line, "Encounters")
    line += 1;
    for (let attack in this.getAvatar().getLevelEncounters()) {
      if (attack != 'attacks') {
        display.drawText(0, line, abilityNum + " - " + this.getAvatar().getLevelEncounters()[attack].name);
        line += 1;
        console.log(this.getAvatar().getLevelEncounters()[attack])
        display.drawText(0, line, this.getAvatar().getLevelEncounters()[attack].blurb);
        line += Math.floor(this.getAvatar().getLevelEncounters()[attack].blurb.length/20 + 1);
        abilityNum += 1;
      }
    }
  }
  renderDailies(display) {
    display.clear();
    let line = 0;
    let abilityNum =  1;
    display.drawText(0, line, "Dailies")
    line += 1;
    for (let attack in this.getAvatar().getLevelDailies()) {
      if (attack != 'attacks') {
        display.drawText(0, line, abilityNum + " - " + this.getAvatar().getLevelDailies()[attack].name);
        line += 1;
        display.drawText(0, line, this.getAvatar().getLevelDailies()[attack].blurb);
        line += Math.floor(this.getAvatar().getLevelDailies()[attack].blurb.length/20 + 1);
        abilityNum += 1;
      }
    }
  }
  renderUtilities(display) {
    display.clear();
    let line = 0;
    let abilityNum =  1;
    display.drawText(0, line, "Utilities")
    line += 1;
    for (let attack in this.getAvatar().getLevelUtilities()) {
      if (attack != 'attacks') {
        display.drawText(0, line, abilityNum + " - " + this.getAvatar().getLevelUtilities()[attack].name);
        line +=  1;
        display.drawText(0, line,  this.getAvatar().getLevelUtilities()[attack].blurb);
        line += Math.floor(this.getAvatar().getLevelUtilities()[attack].blurb.length/20 + 1);
        abilityNum += 1;
      }
    }
  }
  render(display) {
    display.clear()
    display.drawText(7, 5, "At Wills Left: " + this.allowedAtWills + "     Encounters Left: " + this.allowedEncounters + "      Dailies Left: " + this.allowedDailies);
    display.drawText(7, 6, "Utilites Left: " + this.allowedUtilities + "     Feats Left: " + 0 + "           Stat Points Left: " + 0);
    display.drawText(30, 15, "Press esc to continue");
  }
  renderAvatar(display){
    display.clear();
    display.drawText(0, 0, "Level Mode");
    display.drawText(0, 2, "Level: " + this.getAvatar().getLevel());
    display.drawText(0, 3, "Strength: " + this.getAvatar().getStr());
    display.drawText(0, 4, "Constitution: " + this.getAvatar().getCon());
    display.drawText(0, 5, "Dexterity: " + this.getAvatar().getDex());
    display.drawText(0, 6, "Intelligence: " + this.getAvatar().getInt());
    display.drawText(0, 7, "Wisdom: " + this.getAvatar().getWis());
    display.drawText(0, 8, "Charisma: " + this.getAvatar().getCha());
  }
  renderInfo(display){
    display.clear();
    display.drawText(0, 0, "1 - At Wills");
    display.drawText(0, 1, "2 - Encounters");
    display.drawText(0, 2, "3 - Dailies");
    display.drawText(0, 3, "4 - Utilites");
    display.drawText(0, 4, "5 - Stats");
    display.drawText(0, 5, "6 - Feats");
    display.drawText(0, 6, "b to reselect");
  }
  renderStats(display){
    display.clear();
    display.drawText(0, 0, "Stat Points: " + this.getAvatar().getSP());
    display.drawText(0, 1, "1 - Strength");
    display.drawText(0, 2, "2 - Constitution");
    display.drawText(0, 3, "3 - Dexterity");
    display.drawText(0, 4, "4 - Intelligence");
    display.drawText(0, 5, "5 - Wisdom");
    display.drawText(0, 6, "6 - Charisma");
  }
}

export class AttackMode extends UIMode {
  enter(){
    if (!this.levelHandler){
      this.levelHandler = new LevelInput(this.Game);
    }
    this.eventOutput = false;
    this.evtOut = '';
    this.attackList = [];
  }
  getAvatar() {
    return DATASTORE.ENTITIES[this.Game.modes.battle.state.avatarID];
  }
  handleInput(eventType, evt){
    let eventOutput = this.evtOut;
    if (eventType == 'keyup') {
      let secondaryOutput = '';
      if (this.eventOutput) {
        secondaryOutput = this.levelHandler.handleInput(eventType, evt)
      } else {
        eventOutput = this.levelHandler.handleInput(eventType, evt);
        this.evtOut = eventOutput;
        this.eventOutput = true;
      }
      if (this.getAvatar().getStandard() != 0) {
        if (eventOutput == '1') {
          this.renderAtWills(this.Game.display.info.o)
          console.log(secondaryOutput*1-1);
          console.log(this.attackList);
          console.log(this.attackList[secondaryOutput*1-1]);
          console.log(this.getAvatar().getAtWills()[this.attackList[secondaryOutput*1-1]]);
          if (secondaryOutput == '1' || secondaryOutput == '2' || secondaryOutput == '3' || secondaryOutput == '4' || secondaryOutput == '5' || secondaryOutput == '6') {
            if (this.getAvatar().getAtWills()[this.attackList[secondaryOutput*1-1]]) {
              this.getAvatar().setCurrentAttack(this.getAvatar().getAtWills()[this.attackList[secondaryOutput*1-1]]);
              this.attackList = [];
            } else {
              return false;
            }
            this.eventOutput = false;
            this.Game.switchMode('aim');
          }
          if (secondaryOutput == 'b') {
            this.renderInfo(this.Game.display.info.o);
            this.eventOutput = false;
            return true;
          }
        }
        if (eventOutput == '2') {
          this.renderEncounters(this.Game.display.info.o)
          if (secondaryOutput == '1' || secondaryOutput == '2' || secondaryOutput == '3' || secondaryOutput == '4' || secondaryOutput == '5' || secondaryOutput == '6') {
            if (this.getAvatar().getEncounters()[this.attackList[secondaryOutput*1-1]]) {
              this.getAvatar().setCurrentAttack(this.getAvatar().getEncounters()[this.attackList[secondaryOutput*1-1]]);
              this.attackList = [];
            } else {
              return false;
            }
            this.eventOutput = false;
            this.Game.switchMode('aim');
          }
          if (secondaryOutput == 'b') {
            this.renderInfo(this.Game.display.info.o);
            this.eventOutput = false;
            return true;
          }
        }
        if (eventOutput == '3') {
          this.renderDailies(this.Game.display.info.o)
          if (secondaryOutput == '1' || secondaryOutput == '2' || secondaryOutput == '3' || secondaryOutput == '4' || secondaryOutput == '5' || secondaryOutput == '6') {
            if (this.getAvatar().getDailies()[this.attackList[secondaryOutput*1-1]]) {
              this.getAvatar().setCurrentAttack(this.getAvatar().getDailies()[this.attackList[secondaryOutput*1-1]]);
              this.attackList = [];
            } else {
              return false;
            }
            this.eventOutput = false;
            this.Game.switchMode('aim');
          }
          if (secondaryOutput == 'b') {
            this.renderInfo(this.Game.display.info.o);
            this.eventOutput = false;
            return true;
          }
        }
        if (eventOutput == '4') {
          this.renderUtilities(this.Game.display.info.o)
          if (secondaryOutput == '1' || secondaryOutput == '2' || secondaryOutput == '3' || secondaryOutput == '4' || secondaryOutput == '5' || secondaryOutput == '6' || secondaryOutput == '7') {
            if (this.getAvatar().getUtilities()[this.attackList[secondaryOutput*1-1]]) {
              this.getAvatar().setCurrentAttack(this.getAvatar().getUtilities()[this.attackList[secondaryOutput*1-1]]);
              this.attackList = [];
            } else {
              return false;
            }
            this.eventOutput = false;
            this.Game.switchMode('aim');
          }
          if (secondaryOutput == 'b') {
            this.renderInfo(this.Game.display.info.o);
            this.eventOutput = false;
            return true;
          }
        }
      } else {
        Message.send('You have already used your attack for this turn');
        this.Game.switchMode('battle');
        return false;
      }
    }
  }
  renderAtWills(display) {
    display.clear();
    let attacks = '';
    let line = 0;
    let abilityNum =  1;
    display.drawText(0, line, "At Wills");
    line += 1;
    for (let attack in this.getAvatar().getAtWills()) {
      attacks = attacks + attack + ",";
      display.drawText(0, line, abilityNum + " - " + this.getAvatar().getAtWills()[attack].name);
      line += 1;
      display.drawText(0, line,  this.getAvatar().getAtWills()[attack].blurb);
      line += Math.floor(this.getAvatar().getAtWills()[attack].blurb.length/20 + 1);
      abilityNum += 1;
    }
    this.attackList = attacks.split(",");
  }
  renderEncounters(display) {
    display.clear();
    let attacks = '';
    let line = 0;
    let abilityNum =  1;
    display.drawText(0, line, "Encounters")
    line += 1;
    for (let attack in this.getAvatar().getEncounters()) {
      attacks = attacks + attack + ",";
      display.drawText(0, line, abilityNum + " - " + this.getAvatar().getEncounters()[attack].name);
      line += 1;
      console.log(this.getAvatar().getEncounters()[attack])
      display.drawText(0, line, this.getAvatar().getEncounters()[attack].blurb);
      line += Math.floor(this.getAvatar().getEncounters()[attack].blurb.length/20 + 1);
      abilityNum += 1;
    }
    this.attackList = attacks.split(",");
  }
  renderDailies(display) {
    display.clear();
    let attacks = '';
    let line = 0;
    let abilityNum =  1;
    display.drawText(0, line, "Dailies")
    line += 1;
    for (let attack in this.getAvatar().getDailies()) {
      attacks = attacks + attack + ",";
      display.drawText(0, line, abilityNum + " - " + this.getAvatar().getDailies()[attack].name);
      line += 1;
      display.drawText(0, line, this.getAvatar().getDailies()[attack].blurb);
      line += Math.floor(this.getAvatar().getDailies()[attack].blurb.length/20 + 1);
      abilityNum += 1;
    }
    this.attackList = attacks.split(",");
  }
  renderUtilities(display) {
    display.clear();
    let attacks = '';
    let line = 0;
    let abilityNum =  1;
    display.drawText(0, line, "Utilities")
    line += 1;
    for (let attack in this.getAvatar().getUtilities()) {
      attacks = attacks + attack + ",";
      display.drawText(0, line, abilityNum + " - " + this.getAvatar().getUtilities()[attack].name);
      line +=  1;
      display.drawText(0, line,  this.getAvatar().getUtilities()[attack].blurb);
      line += Math.floor(this.getAvatar().getUtilities()[attack].blurb.length/20 + 1);
      abilityNum += 1;
    }
    this.attackList = attacks.split(",");
  }
  render(display) {

  }
  renderAvatar(display){

  }
  renderInfo(display){
    display.clear();
    display.drawText(0, 0, "Attack Mode");
    display.drawText(0, 1, "1 - At Wills");
    display.drawText(0, 2, "2 - Encounters");
    display.drawText(0, 3, "3 - Dailies");
    display.drawText(0, 4, "4 - Utilites");
    display.drawText(0, 15, "Press esc to exit");
  }
}

export class AimMode extends UIMode{
  enter() {
    if (!this.aimHandler){
      this.aimHandler = new AimInput(this.Game);
    }
    Message.send("Entered Aim Mode. Select your target.")
    this.enemies = [];
  }
  getAvatar() {
    return DATASTORE.ENTITIES[this.Game.modes.battle.state.avatarID];
  }
  handleInput(eventType, evt){
    let eventOutput = this.aimHandler.handleInput(eventType, evt);
    if (eventOutput == "1" || eventOutput == "2" || eventOutput == "3" || eventOutput == "4" ||
        eventOutput == "5" || eventOutput == "6" || eventOutput == "7" || eventOutput == "8" ||
        eventOutput == "9") {
      this.getAvatar().setCurrentTarget(DATASTORE.ENTITIES[this.enemies[eventOutput*1-1]]);
      this.getAvatar().raiseMixinEvent('spendStandard');
      Message.send(this.getAvatar().getName() + " attacks " + this.getAvatar().getCurrentTarget().getName() + " with " + this.getAvatar().getCurrentAttack().name);
      this.Game.switchMode('battle');

    }
  }
  render(display) {

  }
  renderAvatar(display){

  }
  renderInfo(display){
    display.clear();
    let enemies = '';
    display.drawText(0, 0, "Aim Mode");
    let line = 1;
    for (let ent in DATASTORE.ENTITIES) {
      //if (DATASTORE.ENTITIES[ent].getType() != this.getAvatar().getType()) {
        display.drawText(0, line, line + " - " + DATASTORE.ENTITIES[ent].getType());
        line += 1;
        enemies = enemies + ent + ",";
      //}
    }
    display.drawText(0, line, "Hit b to reselect")
    this.enemies = enemies.split(",")
  }
}
