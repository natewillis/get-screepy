/// <reference path="ScreepsAutocomplete-master\_references.js" />
require('prototype.spawn');
require('prototype.tower');
require('prototype.creep');
require('prototype.roomposition');
var empire = require('custom.empire');
var spawner = require('main.spawner');

// Run The Empire Memory Script To Initialize
empire.update_world_memory();

module.exports.loop = function () {
    
    //Profiling Variables
    let start = 0;
    let elapsed = 0;

    // Clean up creep memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    // Run empire variable creation code if necessary
    Memory.empire_world_memory_counter += 1;
    if (Memory.empire_world_memory_counter > 60) {
        empire.update_world_memory();
    }

    // find all towers
    start = Game.cpu.getUsed();
    var towers = _.filter(Game.structures, s => s.structureType == STRUCTURE_TOWER);
    // for each tower
    for (let tower of towers) {
        // run tower logic
        tower.defend();
    }
    elapsed = Game.cpu.getUsed() - start;
    //console.log('Towers used ' + elapsed + 'cpu time')

    // for each creeps
    start = Game.cpu.getUsed();
    for (let name in Game.creeps) {
        // run creep logic
        Game.creeps[name].runRole();
    }
    elapsed = Game.cpu.getUsed() - start;
    //console.log('Creep logic used ' + elapsed + 'cpu time')

    // New Spawning Logic
    start = Game.cpu.getUsed();
    spawner.update_creep_queue();
    for (let room_name in Memory.empire.rooms) {
        let room = Memory.empire.rooms[room_name];
        for (let spawn_id of room.spawns) {
            let spawn = Game.getObjectById(spawn_id);
            spawn.spawn_creeps_if_necessary();
        }
    }
    elapsed = Game.cpu.getUsed() - start;
    //console.log('spawning logic used ' + elapsed + 'cpu time')
}