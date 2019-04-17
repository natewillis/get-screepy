var empire = {

    update_world_memory: function () {

        // We're running this function so reinitialize the counter at 0
        Memory.empire_world_memory_counter = 0;

        // Delete The Existing Memory Locations
        if (typeof Memory.empire !== "undefined") {
                delete Memory.empire;
        }

        // Organize By Rooms We Own and have spawns in
        Memory.empire = {}
        Memory.empire.rooms = {};
        for (const i in Game.spawns) {
            let spawn = Game.spawns[i];
            Memory.empire.rooms[spawn.room.name] = {}
        }

        // Add Remote Harvest Rooms Here

        // Populate Rooms
        for (let room_name in Memory.empire.rooms) {

            // Setup Room Object
            let room = Game.rooms[room_name];

            // Setup algorithm variable
            let thing_by_id = {};

            // Setup Empty Dictionaries
            let thing_types = ['roads', 'walls'];
            Memory.empire.rooms[room_name].objects_at_position = {};
            for (let thing_type in thing_types) {
                Memory.empire.rooms[room_name][thing_type] = [];
                thing_by_id[thing_type] = {};
            }

            // Sort Out Structures
            room.find(FIND_STRUCTURES).forEach(function(struct) {

                // Roads
                if (struct.structureType == STRUCTURE_ROAD) {

                    // Memory Storage
                    Memory.empire.rooms[room_name].roads.push(struct.id);
                    if (!(struct.pos.shorthand in Memory.empire.rooms[room_name].objects_at_position)) {
                        for (let thing_type in thing_types) {
                            Memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand][thing_type] = '';
                        }
                        Memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand]['road'] = struct.id;
                    }

                    // Temp Path Algorithm Search
                    thing_by_id.roads[struct.id] = struct;

                } else if (struct.structureType == STRUCTURE_RAMPART || struct.structureType == STRUCTURE_WALL) {

                    // Memory Storage
                    Memory.empire.rooms[room_name].walls.push(struct.id);
                    if (!(struct.pos.shorthand in Memory.empire.rooms[room_name].objects_at_position)) {
                        for (let thing_type in thing_types) {
                            Memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand][thing_type] = '';
                        }
                        Memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand]['road'] = struct.id;
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
                var remaining_thing_ids = Memory.empire.rooms[room_name][thing_type].slice();
                var good_path_ids = [];

                // Figure out closest to top left for starting point
                let min_distance = 1000000;
                let start_thing_id = '';
                for (let thing_id in Memory.empire.rooms[room_name][thing_type]) {
                    let current_range = thing_by_id[thing_type][thing_id].pos.getRangeTo(top_left_point);
                    if (current_range < min_distance) {
                        min_distance = current_range;
                        start_thing_id = thing_id;
                    }
                }

                // Populate Initial Algorithms with current point
                good_path_ids.push(start_thing_id);
                remaining_thing_ids = remaining_thing_ids.filter(e => e !== start_thing_id);

                // Do algorithm
                while (remaining_thing_ids.length > 0) {

                    // Jump Off From Last Point
                    let last_thing_id = good_path_ids[good_path_ids.length-1];
                    let last_thing = thing_by_id[thing_type][last_thing_id];

                    // Create search grid
                    let search_grid = last_thing.pos.surround_grid();

                    // Search for anything in the grid
                    for (current_search_position in search_grid) {
                        if (current_search_position.shorthand() in Memory.empire.rooms[room_name].objects_at_position) {
                            let current_id = Memory.empire.rooms[room_name].objects_at_position[current_search_position.shorthand()][thing_type];
                            if (current_id !== '') {
                                if (current_id in remaining_thing_ids) {
                                    good_path_ids.push(current_id);
                                    remaining_thing_ids = remaining_thing_ids.filter(e => e !== current_id);
                                    continue;
                                }
                            }
                        }
                    }

                    // Be done if we're finished
                    if (remaining_thing_ids.length == 0) {
                        break;
                    }

                    // Check if we added something and if not choose the next closest
                    if (last_thing_id == good_path_ids[good_path_ids.length-1]) {

                        // Setup Min Calc Stuff
                        let min_distance = 1000000;
                        let closest_thing_id = '';

                        // Add the closest one since we couldn't find a new one
                        for (let current_thing_id in remaining_thing_ids) {
                            let current_range = thing_by_id[thing_type][current_thing_id].pos.getRangeTo(thing_by_id[thing_type][last_thing_id]);
                            if (current_range < min_distance) {
                                min_distance = current_range;
                                closest_thing_id = thing_id;
                            }
                        }

                        // Add the closest to the list and we go around the horn again
                        good_path_ids.push(closest_thing_id);
                        remaining_thing_ids = remaining_thing_ids.filter(e => e !== closest_thing_id);

                    }
                }

                // Store the new best path to memory
                Memory.empire.rooms[room_name].optimized_role_paths[thing_type] = good_path_ids;
                    
            }
        }
    }

};
module.exports = empire;