var roleScoutStatic = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // Variables
        let room = Game.rooms[creep.memory.room];

        // Initialize Creep If Necessary
        if (!('scout_static' in creep.memory)) {

            // Find an unassigned scout room
            let assigned_room = '';
            let exits = Game.map.describeExits(creep.memory.room);
            console.log(JSON.stringify(exits));
            for (const i in exits) {
                let exit = exits[i];
                // Loop through all the creeps to make sure 
                let assigned = false;
                for (const i in Game.creeps) {
                    let search_creep = Game.creeps[i];
                    if (search_creep.memory.role == 'scout_static' && search_creep.memory.room == creep.memory.room) {
                        if ('scout_static' in search_creep.memory) {
                            if ('assigned_room' in search_creep.memory.scout_static) {
                                if (search_creep.memory.scout_static.assigned_room == exit) {
                                    assigned = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (!assigned) {
                    assigned_room = exit;
                    break;
                }
            }

            // set the road_repairer data structure
            if (assigned_room !== '') {
                creep.memory.scout_static = {};
                creep.memory.scout_static.assigned_room = assigned_room;
            }
            

        }

        // Initialize Creep If Necessary
        if (!('scout_static' in creep.memory)) {
            console.log('NO FREE EMPTY ROOMS FOUND FOR SCOUT!');
            return;
        }

        // Simple Scouting Logic
        if (creep.room.name !== creep.memory.scout_static.assigned_room) {
            // Move to the room
            creep.moveTo(new RoomPosition(25,25, creep.memory.scout_static.assigned_room));
        } else {
            if (creep.pos.x==0 || creep.pos.x == 49 || creep.pos.y == 0 || creep.pos.y == 49) {
                creep.moveTo(new RoomPosition(25,25, creep.memory.scout_static.assigned_room));
            }
        }

    }
};

module.exports = roleScoutStatic;