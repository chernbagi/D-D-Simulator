import {TILES} from './tile.js';
import {init2DArray, uniqueID} from './util.js';
import ROT from 'rot-js';
import {DATASTORE} from './datastore.js';
import {SCHEDULER} from './timing.js';


class Map {
  constructor(xdim, ydim, mapType){
    this.state = {};
    this.state.xdim = xdim || 1;
    this.state.ydim = ydim || 1;
    this.state.mapType = mapType || 'basic caves';
    this.state.setupRngState = ROT.RNG.getState();
    this.state.id = uniqueID('map-' + this.state.mapType);
    this.state.entityIDtoMapPos = {};
    this.state.mapPostoEntityID = {};
  }

  build () {
    this.tileGrid = TILE_GRID_GENERATOR['basicCaves'](this.state.xdim, this.state.ydim, this.state.setupRngState);
  }

  getID() {return this.state.id;}
  setID(newID) {this.state.id = newID;}

  getXdim() {return this.state.xdim;}
  setXdim(newXdim) {this.state.xdim = newXdim;}

  getYdim() {return this.state.ydim;}
  setYdim(newID) {this.state.ydim = newYdim;}

  getMapType() {return this.state.mapType;}
  setMapType(newMapType) {this.state.mapType = newMapType;}

  getRngState() {return this.state.setupRngState;}
  setRngState(newRngState) {this.state.setupRngState = newRngState;}

  updateEntityPosition(ent, newX, newY) {
    let oldPos = this.state.entityIDtoMapPos[ent.getID()];
    delete this.state.mapPostoEntityID[oldPos];

    this.state.mapPostoEntityID[`${newX},${newY}`] = ent.getID()
    this.state.entityIDtoMapPos[ent.getID()] = `${newX},${newY}`
  }
  findClosestEnemyEntity(ent) {
    let minDist = 1000;
    let entPos = this.state.entityIDtoMapPos[ent.getID()];
    for (let entID in this.state.entityIDtoMapPos) {
      let dist = Math.sqrt(Math.pow((entPos.charAt(0)*1 - this.state.entityIDtoMapPos[entID].charAt(0)*1), 2) + Math.pow((entPos.charAt(2)*1 - this.state.entityIDtoMapPos[entID].charAt(2)*1), 2));
      if (dist < minDist && dist != 0 && DATASTORE.ENTITIES[entID].name != 'tree' && DATASTORE.ENTITIES[entID].name != 'avatar') {
        minDist = dist;
        let closeEntID = entID;
      }
    }
    if (closeEntID){
      if (DATASTORE.ENTITIES[closeEntID]){
        return DATASTORE.ENTITIES[closeEntID];
      }
    }
    return false;
  }
  findClosestEntInLine(ent, direction) {
    if (direction == 'w') {
      for (let i = (ent.getY()-1); i > 0; i--){
        for (let entID in this.state.entityIDtoMapPos) {
          if (DATASTORE.ENTITIES[entID].getPos() == `${ent.getX()},${i}`) {
            return DATASTORE.ENTITIES[entID];
            console.dir(DATASTORE.ENTITIES[entID]);
          }
        }
      }
      return false;
    }
    if (direction == 's') {
      for (let i = (ent.getY()+1); i < this.getXdim(); i++){
        for (let entID in this.state.entityIDtoMapPos) {
          if (DATASTORE.ENTITIES[entID].getPos() == `${ent.getX()},${i}`) {
            return DATASTORE.ENTITIES[entID];
            console.dir(DATASTORE.ENTITIES[entID]);
          }
        }
      }
      return false;
    }
    if (direction == 'a') {
      for (let i = (ent.getX()-1); i > 0; i--){
        for (let entID in this.state.entityIDtoMapPos) {
          if (DATASTORE.ENTITIES[entID].getPos() == `${i},${ent.getY()}`) {
            return DATASTORE.ENTITIES[entID];
            console.dir(DATASTORE.ENTITIES[entID]);
          }
        }
      }
      return false;
    }
    if (direction == 'd') {
      for (let i = (ent.getX()+1); i < this.getXdim(); i++){
        for (let entID in this.state.entityIDtoMapPos) {
          if (DATASTORE.ENTITIES[entID].getPos() == `${i},${ent.getY()}`) {
            return DATASTORE.ENTITIES[entID];
            console.dir(DATASTORE.ENTITIES[entID]);

          }
        }
      }
      return false;
    }
  }
  findEntsInArea(x1, y1, x2, y2) {
    let ents = {};
    for (let entID in this.state.entityIDtoMapPos) {
      let x = DATASTORE.ENTITIES[entID].getX();
      let y = DATASTORE.ENTITIES[entID].getY();
      if (x1 < x && x < x2 && y1 < y && y < y2) {
        ents[entID] == DATASTORE.ENTITIES[entID];
      }
    }
    if (ents != {}) {
      return ents;
    }
    return false;
  }
  extractEntity(ent){
    delete this.state.mapPostoEntityID[this.state.entityIDtoMapPos[ent.getID()]];
    delete this.state.entityIDtoMapPos[ent.getID()];
    return ent;
  }
  addEntityAt(ent, xPos, yPos) {
    let pos = `${xPos},${yPos}`;
    this.state.entityIDtoMapPos[ent.getID()] = pos;
    this.state.mapPostoEntityID[pos] = ent.getID();
    ent.setMapID(this.getID());
    ent.setX(xPos);
    ent.setY(yPos);
  }
  addEntityAtRandomPosition(ent) {
    let openPos = this.getRandomOpenPosition();
    let p = openPos.split(',');
    this.addEntityAt(ent, p[0], p[1]);
  }
  nextLevel() {
    for (let entID in DATASTORE.ENTITIES) {
      if (DATASTORE.ENTITIES[entID].name == 'soldier' || DATASTORE.ENTITIES[entID].name == 'centaurion' ||DATASTORE.ENTITIES[entID].name == 'general' || DATASTORE.ENTITIES[entID].name == 'royal guard' || DATASTORE.ENTITIES[entID].name == 'king'){
        return false;
      }
    }
    return true;
  }
  getRandomOpenPosition() {
      let x = Math.trunc(ROT.RNG.getUniform()*this.state.xdim);
      let y = Math.trunc(ROT.RNG.getUniform()*this.state.ydim);
      if (this.isPositionOpen(x, y)) {
        return `${x},${y}`;
      }
      return this.getRandomOpenPosition();
  }
  isPositionOpen(x, y) {
    if (this.tileGrid[x][y].isA('floor')) {
      return true;
    }
    return false;
  }

  getTargetPositionInfo(x, y) {
    let info = {
      entity: '',
      tile: this.getTile(x, y)
    };
    let entID = this.state.mapPostoEntityID[`${x},${y}`];
    if (entID) {
      info.entity = DATASTORE.ENTITIES[entID];
    }
    return info;
  }

  render(display, cameraX, cameraY){
    let cx = 0;
    let cy = 0;
    let xstart = cameraX - Math.trunc(display.getOptions().width / 2);
    let xend = xstart + display.getOptions().width;
    let ystart = cameraY - Math.trunc(display.getOptions().height / 2);
    let yend = ystart + display.getOptions().height;
    for(let xi=xstart;xi<xend;xi++){
      for(let yi=ystart;yi<yend;yi++){
        let pos = `${xi},${yi}`;
        if (this.state.mapPostoEntityID[pos]) {
          DATASTORE.ENTITIES[this.state.mapPostoEntityID[pos]].render(display, cx, cy);
        }
        else{
          this.getTile(xi, yi).render(display, cx, cy);
        }
        cy++;
      }
      cy = 0;
      cx++;
    }
  }

  toJSON() {
    return JSON.stringify(this.state);
  }

  getTile(mapx, mapy){
    if (mapx < 0 || mapx > this.state.xdim - 1 || mapy < 0 || mapy > this.state.ydim - 1){
      return TILES.NULLTILE;
    }
    return this.tileGrid[mapx][mapy];
  }
}

let TILE_GRID_GENERATOR = {
  basicCaves: function(xdim, ydim, rngState) {
    let tg = init2DArray(xdim, ydim, TILES.NULLTILE);
    let gen = new ROT.Map.Cellular(xdim, ydim, {connected: true});
    let origRngState = ROT.RNG.getState();
    ROT.RNG.setState(rngState);
    gen.randomize(0);
    for (var i = 3; i > 0; i--){
      gen.create();
    }
    gen.connect(function(x, y, isWall){
      tg[x][y] = (isWall || x==0 || y==0 || x==xdim-1 || y==ydim-1) ? TILES.WALL : TILES.FLOOR;
    });
    ROT.RNG.setState(origRngState)
    return tg;
  }
}

export function MapMaker(mapData) {
  let m = new Map(mapData.xdim, mapData.ydim, mapData.mapType);
  if (mapData.id) {
    m.setID(mapData.id);
  }
  if (mapData.setupRngState) {
    m.setRngState(mapData.setupRngState);
  }

  DATASTORE.MAPS[m.getID()] = m;
  return m;
}
