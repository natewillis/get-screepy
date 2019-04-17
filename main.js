/// <reference path="ScreepsAutocomplete-master\_references.js" />
require('prototype.spawn');
require('prototype.tower');
require('prototype.creep');
require('prototype.roomposition');
var empire = require('custom.empire');

// Persistant Spawn Variables
for (let spawn_name in Game.spawns) {
    Game.spawns[spawn_name].memory.energy_sources = [];
    Game.spawns[spawn_name].memory.creep_creation_queue = [];

    // Figure Out Max Screep Value
    let creeps = _.filter(Game.creeps, (creep) => creep.memory.spawn == spawn_name);
    let current_indexes = creeps.map(creep => parseInt(creep.name.split("_screep-")[1]));
    console.log('Screeps have the following values: ' + JSON.stringify(current_indexes));
    let max_index = 0;
    if (current_indexes.length>0) {
        max_index = Math.max(...current_indexes);
    }
    console.log('The max is ' + max_index);
    Game.spawns[spawn_name].memory.screep_index = max_index+1;
}

// Fill Statics (This should be done programatically)
Game.spawns['Spawn1'].memory.energy_sources.push({
    source_location: new RoomPosition(4,13,'E18N44'),
    harvest_locations:[
        new RoomPosition(5,14,'E18N44')
    ]
});
Game.spawns['Spawn1'].memory.energy_sources.push({
    source_location: new RoomPosition(6,11,'E18N44'),
    harvest_locations:[
        new RoomPosition(6,12,'E18N44'),
        new RoomPosition(7,12,'E18N44'),
        new RoomPosition(7,11,'E18N44'),
        new RoomPosition(7,10,'E18N44')
    ]
});
if (false) {
    Game.spawns['Spawn1'].memory.energy_sources.push({
        source_location: new RoomPosition(5,40,'E18N45'),
        harvest_locations:[
            new RoomPosition(6,41,'E18N45'),
            new RoomPosition(5,41,'E18N45'),
            new RoomPosition(4,41,'E18N45'),
            new RoomPosition(4,40,'E18N45'),
            new RoomPosition(4,39,'E18N45')
        ]
    });
    Game.spawns['Spawn1'].memory.energy_sources.push({
        source_location: new RoomPosition(17,38,'E19N44'),
        harvest_locations:[
            new RoomPosition(18,39,'E19N44')
        ]
    });
    Game.spawns['Spawn1'].memory.energy_sources.push({
        source_location: new RoomPosition(42,21,'E19N45'),
        harvest_locations:[
            new RoomPosition(41,22,'E19N45'),
            new RoomPosition(42,22,'E19N45'),
            new RoomPosition(43,22,'E19N45'),
            new RoomPosition(43,21,'E19N45')
        ]
    });
    Game.spawns['Spawn1'].memory.energy_sources.push({
        source_location: new RoomPosition(10,13,'E19N45'),
        harvest_locations:[
            new RoomPosition(9,14,'E19N45'),
            new RoomPosition(10,14,'E19N45'),
            new RoomPosition(11,14,'E19N45')
        ]
    });
    Game.spawns['Spawn1'].memory.energy_sources.push({
        source_location: new RoomPosition(10,13,'E19N43'),
        harvest_locations:[
            new RoomPosition(6,12,'E19N43')
        ]
    });
}

// Run The Empire Memory Script To Initialize
empire.update_world_memory();

module.exports.loop = function () {
    
    //Profiling Variables
    let start = 0;
    let elapsed = 0;

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    // Run empire variable creation code if necessary
    Game.memory.empire_world_memory_counter += 1;
    if (Game.memory.empire_world_memory_counter > 60) {
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
    console.log('Towers used ' + elapsed + 'cpu time')

    // for each creeps
    start = Game.cpu.getUsed();
    for (let name in Game.creeps) {
        // run creep logic
        Game.creeps[name].runRole();
    }
    elapsed = Game.cpu.getUsed() - start;
    console.log('Creep logic used ' + elapsed + 'cpu time')

    // New Spawning Logic
    start = Game.cpu.getUsed();
    for (let spawnName in Game.spawns) {
        // run spawn logic
        Game.spawns[spawnName].update_creep_queue();
        Game.spawns[spawnName].spawn_creeps_if_necessary();
    }
    elapsed = Game.cpu.getUsed() - start;
    console.log('spawning logic used ' + elapsed + 'cpu time')
}