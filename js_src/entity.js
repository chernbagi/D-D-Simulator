//base class that defines all entities (creatures etc.) in the GAME
import {MixableSymbol} from './mixable_symbol.js';
import {uniqueID} from './util.js';
import {DATASTORE} from './datastore.js';
import {SCHEDULER} from './timing.js';


export class Entity extends MixableSymbol {
  constructor(template){
    super(template);
    this.name = template.name;
    if (! this.state){this.state = {};}
    this.state.x = 0;
    this.state.y = 0;
    this.state.setupMapID = 0;
    this.state.id = uniqueID();
    this.state.type = template.type;

  }

  getID() {return this.state.id;}
  setID(newID) {this.state.id = newID;}

  getName() {return this.state.name;}
  setName(newName) {this.state.name = newName;}

  getX() {return this.state.x;}
  setX(newX) {this.state.x = newX;}

  getY() {return this.state.y;}
  setY(newY) {this.state.y = newY;}

  getPos() {return `${this.state.x},${this.state.y}`}

  getMapID() {return this.state.setupMapID;}
  setMapID(newMapID) {this.state.setupMapID = newMapID;}

  getMap(){
    return DATASTORE.MAPS[this.state.setupMapID];
  }
  getType(){
    return this.state.type;
  }
  setType(type){
    this.state.type = type;
  }

  destroy(){
    this.getMap().extractEntity(this);
    SCHEDULER.remove(this);
    delete DATASTORE.ENTITIES[this.getID()];
    this.getMap().nextLevel();
  }

  toJSON() {
    return JSON.stringify(this.state);
  }
  fromJSON(s) {
    this.state = JSON.parse(s);
  }
}
