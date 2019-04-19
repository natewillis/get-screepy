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

                    // Check if we're topped off
                    if (room.energyAvailable >= room.memory.creep_creation_queue[0].cost) {
                        // Check if were spawning something
                        if (spawn.spawning == null) {
                            retVal = spawn.spawnCreep(
                                room.memory.creep_creation_queue[0].body, 
                                room.memory.creep_creation_queue[0].name,
                                room.memory.creep_creation_queue[0].opts
                            );
                            if(retVal == 0) {
                                console.log('Spawning new creep: ' + room.memory.creep_creation_queue[0].name);
                                room.memory.creep_creation_queue.shift();
                            }
                        }
                    }
                }

            }
        }
    };