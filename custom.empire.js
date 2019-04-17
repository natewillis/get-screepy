var utilities = require('custom.utilities');

var empire = {

    update_world_memory: function () {

        console.log('Program has requested we update the empire world memory');

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
            Memory.empire.rooms[spawn.room.name] = {};
        }

        // Add Remote Harvest Rooms Here

        // Populate Rooms
        for (let room_name in Memory.empire.rooms) {

            // Setup algorithm variables
            let thing_by_id = {};
            let structure_types = {
                'roads':[STRUCTURE_ROAD], 
                'walls':[STRUCTURE_RAMPART,STRUCTURE_WALL],
                'towers':[STRUCTURE_TOWER], 
                'containers':[STRUCTURE_CONTAINER], 
                'storages':[STRUCTURE_STORAGE], 
                'extensions':[STRUCTURE_EXTENSION],
                'spawns': [STRUCTURE_SPAWN],
                'controllers': [STRUCTURE_CONTROLLER]
            };

            // Setup Room Object
            let room = Game.rooms[room_name];

            // Setup Empty Room Dictionaries
            Memory.empire.rooms[room_name].objects_at_position = {};
            Memory.empire.rooms[room_name].optimized_role_paths = {};

            // Setup Thing Specific Empty Variables
            for (let structure_type in structure_types) {
                Memory.empire.rooms[room_name][structure_type] = [];
                thing_by_id[structure_type] = {};
            }

            // Sort Out Structures
            room.find(FIND_STRUCTURES).forEach(function(struct) {

                // Store the various structures
                for (let structure_type in structure_types) {
                    for (let structure_type_const of structure_types[structure_type]) {
                        if (struct.structureType == structure_type_const) {

                            // Store Array Of Object Type
                            Memory.empire.rooms[room_name][structure_type].push(struct.id);

                            // Store Obj At Position Stuff
                            if (!(struct.pos.shorthand() in Memory.empire.rooms[room_name].objects_at_position)) { // Init If Necessary

                                // Init Empty Shorthand Dict
                                Memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand()] = {};

                                // Add Empty space for all the types
                                for (let pos_init_structure_type in structure_types) {
                                    Memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand()][pos_init_structure_type] = '';
                                }

                            }

                            // Add this specific instance to the position stuff
                            Memory.empire.rooms[room_name].objects_at_position[struct.pos.shorthand()][structure_type] = struct.id;

                            // Temp Path Algorithm Search
                            thing_by_id.roads[struct.id] = struct;

                        }
                    }
                }

            });

            // Get Wall/Road Path
            let thing_types = ['roads', 'walls'];

            // Choose starting point (closest to 0,0)
            let top_left_point = new RoomPosition(0,0,room_name);
            
            for (let thing_type of thing_types) {

                // Init Variables
                var remaining_thing_ids = Memory.empire.rooms[room_name][thing_type].slice();
                var good_path_ids = [];

                // Figure out closest to top left for starting point
                let min_distance = 1000000;
                let start_thing_id = '';
                for (let thing_id of Memory.empire.rooms[room_name][thing_type]) {
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
                    for (current_search_position of search_grid) {
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
                        for (let current_thing_id of remaining_thing_ids) {
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

            // Add Energy Sources
            Memory.empire.rooms[room_name].sources = [];
            room.find(FIND_SOURCES).forEach(function(source) {

                //Create Empty Source Object
                let source_obj = {};
                
                //Store ID
                source_obj.id = source.id;
                source_obj.harvest_pos_shorthand = null;

                // Find Closest Empty Terrain
                for (let current_pos of source.pos.surround_grid()) {
                    let look_return = current_pos.look();
                    let containers = look_return.filter(function(look_object) {
                        if ('structureType' in look_object) {
                            return look_object.structureType == STRUCTURE_CONTAINER;
                        } else {
                            return false;
                        }
                    });
                    if (containers.length==1) {
                        // We've found an empty position next to an energy source next to a container!
                        source_obj.harvest_pos_shorthand = current_pos.shorthand();
                        break;
                    } else if (look_return.length==1) {
                        if (look_return[0].type == 'terrain') {
                            if (look_return[0].terrain=='plain' || look_return[0].terrain=='swamp') {
                                // We've found an empty position next to an energy source!
                                source_obj.harvest_pos_shorthand = current_pos.shorthand();
                            }
                        }
                    }
                }

                // This energy source has access to it so it counts 
                if (source_obj.harvest_pos_shorthand !== null) {
                    Memory.empire.rooms[room_name].sources.push(source_obj);
                }
                
            });
        }
    }

};
module.exports = empire;