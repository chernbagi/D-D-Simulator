//create basis for things to be displayed on the map

import {Color} from './colors.js';

export class DisplaySymbol {
  constructor(template) {
    this.chr = template.chr || ' ';
    this.fg = template.fg || Color.FG;
    this.bg = template.bg || Color.BG;
  }

  render(display, consoleX, consoleY) {
    display.draw(consoleX, consoleY, this.chr, this.fg, this.bg);
  }

}
