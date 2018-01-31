//class for map tiles
import {DisplaySymbol} from './display_symbol.js';
// import {Color} from './colors.js';

// class Tile extends DisplaySymbol {
//   constructor(name, chr, fg, bg){
//     super(chr, fg, bg);
//     this.name = name;
//   }
// }

class Tile extends DisplaySymbol{
  constructor(template){
    super(template);
    this.name = template.name;
    this.passable = template.transparent || false;
    this.transparent = template.transparent || false;
  }
  isPassable() {return this.passable;}
  isImpassable() {return !this.passable;}
  setPassable(newVal) {this.passable = newVal;}

  isTransparent() {return this.transparent;}
  isOpaque() {return !this.transparent;}
  setTransparent(newVal) {this.transparent = newVal;}

  isA(name) {
    return this.name == name;
  }
}

export let TILES = {
  NULLTILE: new Tile({name: 'nulltile', chr: ' ', passable: false, transparent: false}),
  WALL: new Tile({name: 'wall', chr: '#', passable: false, transparent: false}),
  FLOOR: new Tile({name: 'floor', chr: '.', passable: true, transparent: true})
}
