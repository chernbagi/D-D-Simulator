import {Color} from './colors.js'

export let Message = {
  curMessage: '',
  curMessage2: '',
  curMessage3: '',
  targetDisplay: '',
  cache: '',
  init: function(targetDisplay){
    this.targetDisplay = targetDisplay;
  },
  render: function() {
    if(!this.targetDisplay){console.log("ploop");return;}
    this.targetDisplay.clear();

    this.targetDisplay.drawText(1,1,this.curMessage,Color.FG,Color.BG);
    this.targetDisplay.drawText(1,2,this.curMessage2,Color.FG,Color.BG);
    this.targetDisplay.drawText(1,3,this.curMessage3,Color.FG,Color.BG);
  },
  send: function(msg){
    this.curMessage3 = this.curMessage2;
    this.curMessage2 = this.curMessage;
    this.curMessage = msg;

    this.cache = this.curMessage + "\n" + this.cache;
    if (this.cache) {
      if (this.cache.split("\n").length == 100){
        this.cache = this.cache[0, this.cache.split("\n").length - this.cache.split("\n")[99].length - 1]
      }
    }
    this.render();
  },
  clear: function(){
    //this.curMessage = '';
    this.targetDisplay.drawText(1,1,'',Color.FG,Color.BG);
    this.targetDisplay.drawText(1,2,'',Color.FG,Color.BG);
  },
  clearCache: function() {
    this.cache = '';
  }
};
