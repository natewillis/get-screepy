/// <reference path="ScreepsAutocomplete-master\_references.js" />
var utilities = require('custom.utilities');

// Create Spawn Function 
StructureSpawn.prototype.spawn_creeps_if_necessary = 
    function() {
        
        for (let room_name in Memory.empire.rooms) {

            // Store this reference in memory for easy coding
            let empire_room = Memory.empire.rooms[room_name];
            let room = Game.rooms[room_name];

            // Run this code for every spawn
            for (let spawn_id of empire_room.spawns) {

                let spawn = Game.getObjectById(spawn_id);

                // Check The Queue Size
                console.log('Queue size is ' + room.memory.creep_creation_queue.length);
                if (room.memory.creep_creation_queue.length > 0) {

                    // Current room info
                    let max_energy = room.energyCapacityAvailable;
                    let rcl = Game.getObjectById(empire_room.controllers[0]).level;

                    // Get Creeps That Belong To Me
                    var creeps = _.filter(Game.creeps, (creep) => creep.memory.room == room_name);

                    // Something is wrong since all my creeps are dead
                    if (Object.keys(creeps).length <= 2) {
                        rcl = 1; // Set the rcl low to rebuild things
                        max_energy = Math.max(300,room.energyAvailable);
                    }

                    // Check if we're topped off
                    if (room.energyAvailable >= max_energy) {
                        // Check if were spawning something
                        if (spawn.spawning == null) {
                            retVal = spawn.spawnCreep(
                                room.memory.creep_creation_queue[0].body, 
                                room.memory.creep_creation_queue[0].name,
                                room.memory.creep_creation_queue[0].opts
                            );
                            if(retVal == 0) {
                                console.log('Spawning new creep: ' + this.memory.creep_creation_queue[0].name);
                                room.memory.creep_creation_queue.shift();
                            }
                        }
                    }
                }

            }
        }
    };