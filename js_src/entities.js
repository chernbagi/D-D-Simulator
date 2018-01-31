import {Factory} from './factory.js';
import {Entity} from './entity.js';

export let EntityFactory = new Factory(Entity, 'ENTITIES');

EntityFactory.learn({
  playerName: 'Human',
  name: 'Example',
  type: 'player',
  chr:'@',
  fg: '#eb4',
  mixinNames: ['TimeTracker', 'WalkerCorporeal', 'PlayerMessage', 'HitPoints', 'Levels', 'ActorPlayer', 'RacePlayer', 'ClassPlayer', 'ExpPlayer', 'PlayerStats', 'Defenses', 'BasicAttacker', 'PlayerAbilities'],
  size: 'medium',
  age: 'unknown',
  gender: 'male',
  height: 75,
  weight: 100,
  alignment: 'unaligned',
  deity: 'none',
  race: 'human',
  class: 'fighter',
  strength: 16,
  constitution: 14,
  dexterity: 12,
  intelligence: 11,
  wisdom: 10,
  charisma: 13,
});
