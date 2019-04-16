var empire = {

    update_world_memory: function () {

        // Delete The Existing Memory Locations
        if (typeof Game.memory.empire !== "undefined") {
                delete Game.memory.empire;
        }

        // Organize By Rooms We Own and have spawns in
        Game.memory.empire.rooms = {};
        for (let spawn of Game.spawns) {
                Game.memory.empire.rooms[spawn.room.name] = {}
        }

        // Add Remote Harvest Rooms Here

        // Populate Rooms
        for (let room_name in Game.memory.empire.rooms) {

            // Setup Room Object
            let room = Game.rooms[room_name];

            // Setup algorithm variable
            let thing_by_id = {};

            // Setup Empty Dictionaries
            let thing_types = ['roads', 'walls'];
            Game.memory.empire.rooms[room_name].objects_at_position = {};
            for (let thing_type in thing_types) {
                Game.memory.empire.rooms[room_name][thing_type] = [];
                thing_by_id[thing_type] = {};
            }

            // Sort Out Structures
            room.find(FIND_STRUCTURES).forEach(function(struct) {

                // Roads
                if (struct.structureType == STRUCTURE_ROAD) {

                    // Memory Storage
                    Game.memory.empire.rooms[room_name].roads.push(struct.id);
                    if (!(struct.pos.shorthand in Game.memory.empire.rooms[room_name].objects_at_position)) {
                        for (let thing_type in thing_types) {
                            Game.memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand][thing_type] = '';
                        }
                        Game.memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand]['road'] = struct.id;
                    }

                    // Temp Path Algorithm Search
                    thing_by_id.roads[struct.id] = struct;

                } else if (struct.structureType == STRUCTURE_RAMPART || struct.structureType == STRUCTURE_WALL) {

                    // Memory Storage
                    Game.memory.empire.rooms[room_name].walls.push(struct.id);
                    if (!(struct.pos.shorthand in Game.memory.empire.rooms[room_name].objects_at_position)) {
                        for (let thing_type in thing_types) {
                            Game.memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand][thing_type] = '';
                        }
                        Game.memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand]['road'] = struct.id;
                    }

                    // Temp Path Algorithm Search
                    thing_by_id.walls[struct.id] = struct;

                }

            });

            // Get Wall/Road Path

            // Choose starting point (closest to 0,0)
            let top_left_point = new RoomPosition(0,0,room_name);
            
            for (let thing_type in thing_types) {

                // Init Variables
                var remaining_things = Game.memory.empire.rooms[room_name][thing_type].slice();
                var good_path = [];

                // Figure out closest to top left for starting point
                let min_distance = 1000000;
                let start_thing = null;
                for (let thing_id in Game.memory.empire.rooms[room_name][thing_type]) {
                    let current_range = thing_by_id[thing_type][thing_id].pos.getRangeTo(top_left_point);
                    if (current_range < min_distance) {
                        min_distance = current_range;
                        start_thing = thing_id;
                    }
                }

                // Populate Initial Algorithms with current point
                good_path.push(start_thing);
                remaining_things = remaining_things.filter(e => e !== start_thing);

                // Do algorithm
                while (remaining_things.length > 0) {

                }
                    
            }
        }
    }

};
module.exports = empire;