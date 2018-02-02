import ROT from 'rot-js';
import * as U from './util.js';
import {StartupMode, BattleMode, WinMode, LoseMode, CacheMode, HelpMode, PersistenceMode, LevelMode, ControlMode, AttackMode, AimMode} from './ui_mode.js';
import {Message} from './message.js';
import {DATASTORE} from './datastore.js';
import {Timer} from './time.js'

export let Game = {
SPACING: 1.1,
  display: {
    main: {
      w: 80,
      h: 24,
      o: null
    },
    avatar: {
      w: 24,
      h: 24,
      o: null
    },
    message: {
      w: 127,
      h: 6,
      o: null
    },
    info: {
      w: 20,
      h: 24,
      o: null
    },
  },

  modes: {
    startup: '',
    battle: '',
    win: '',
    lose: '',
    cache: '',
    help: '',
    persistence: '',
    level: '',
    control:'',
    attack:'',
    aim: '',
  },
  curMode: '',

  init: function() {
    this.display.main.o = new ROT.Display({
      width: this.display.main.w,
      height: this.display.main.h,
      spacing: this.SPACING});
    this.display.avatar.o = new ROT.Display({
      width: this.display.avatar.w,
      height: this.display.avatar.h,
      spacing: this.SPACING});
    this.display.message.o = new ROT.Display({
      width: this.display.message.w,
      height: this.display.message.h,
      spacing: this.SPACING});
    this.display.info.o = new ROT.Display({
      width: this.display.info.w,
      height: this.display.info.h,
      spacing: this.SPACING});
    Message.targetDisplay = this.display.message.o
    this.setupModes();
    this.switchMode('startup');
    DATASTORE.GAME = this;
  },

  setupModes: function(){
    this.modes.startup = new StartupMode(this);
    this.modes.battle = new BattleMode(this);
    this.modes.win = new WinMode(this);
    this.modes.lose = new LoseMode(this);
    this.modes.cache = new CacheMode(this);
    this.modes.help = new HelpMode(this);
    this.modes.persistence = new PersistenceMode(this);
    this.modes.level = new LevelMode(this);
    this.modes.attack = new AttackMode(this);
    this.modes.control = new ControlMode(this);
    this.modes.aim = new AimMode(this);
  },

  switchMode: function(newModeName){
    if (this.curMode) {
      this.curMode.exit();
    }
    this.curMode = this.modes[newModeName];
    if (this.curMode){
      console.log(this.curMode)
      this.curMode.enter();
    }
    this.render();
  },
  setupNewGame: function(){
    // this.timer = new Timer(1000000);
    this.randomSeed = 5 + Math.floor(Math.random()*100000);
    console.log("using random seed "+this.randomSeed);
    ROT.RNG.setSeed(this.randomSeed);
    this.modes.battle.setupNewGame();
    console.log('Hello!')
    console.log('Hello!')
  },

  getDisplay: function (displayId) {
    if (this.display.hasOwnProperty(displayId)) {
      return this.display[displayId].o;
    }
    return null;
  },

  render: function() {
    this.renderAvatar();
    this.renderMain();
    this.renderMessage();
    this.renderInfo();
  },

  renderAvatar: function() {
    this.curMode.renderAvatar(this.display.avatar.o);
  },

  renderMessage: function() {
    Message.render(this.display.message.o);
  },

  renderMain: function() {
    //if(this.curMode.hasOwnProperty('render')){
    this.curMode.render(this.display.main.o);
    //}
  },
  renderInfo: function() {
    //if(this.curMode.hasOwnProperty('render')){
    this.curMode.renderInfo(this.display.info.o);
    //}
  },

  bindEvent: function(eventType) {
    window.addEventListener(eventType, (evt) => {
      this.eventHandler(eventType, evt);
    });
  },

  eventHandler: function (eventType, evt) {
    // When an event is received have the current ui handle it
    if (this.curMode !== null && this._curMode != '') {
        if (this.curMode.handleInput(eventType, evt)){
          this.render();
          //Message.ageMessages();
        }
    }
  },

  toJSON: function() {
    let json = '';
    json = JSON.stringify({
      rseed: this.randomSeed,
      playModeState: this.modes.battle,
      });
    return json;
  },

  restoreFromState(stateData){
    this.state = stateData;
  },

  fromJSON: function(json) {
    let state = JSON.parse(json);
    this.randomSeed = state.rseed;
    this.modes.battle.restoreFromState(state.playModeState);
  }
};
