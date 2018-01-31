//implements a timer
import {DATASTORE} from './datastore.js';

export class Timer {
  constructor(timeAllowed){
    if (! this.state){this.state = {};}
    this.state.timeStart = DATASTORE.TIME.timeStart || 0;
    this.state.timeTaken = DATASTORE.TIME.timeTaken || 0;
    DATASTORE.TIME = this.state;
  }
  start() {
    this.state.timeStart = Date.now();
    if (this.getTimeTaken()){
      this.timeSinceStart = this.getTimeTaken();
    } else {
      this.timeSinceStart = 0;
    }
    DATASTORE.TIME.timeStart = this.state.timeStart;
  }
  getStart() {
    if (this.state.timeStart){
      return this.state.timeStart;
    } else {return false;}

  }
  hasStarted() {
    if (this.getStart() != false) {
      return true;
    } else {return false;}
  }
  pause() {
    this.pausedTime = Date.now();
  }
  restart () {
    this.restartedTime = Date.now();
    this.timeSinceStart = this.getTimeTaken() - (this.restartedTime-this.pausedTime);
  }
  getTimeTaken() {
    this.state.timeTaken = Date.now() - (this.getStart() + this.timeSinceStart);
    DATASTORE.TIME.timeTaken = this.state.timeTaken;
    return this.state.timeTaken;
  }
  getRemainingTime() {
    let remainingTime = this.timeAllowed() - this.getTimeTaken();
    let remainingDays = Math.round(remainingTime/100000);
    if (remainingTime <= 0){
      return false;
    }
    return remainingDays;
  }
  toJSON() {
    return JSON.stringify(this.state);
  }
  restoreFromState(stateDataString){
    this.state = JSON.parse(stateDataString);
  }
}
