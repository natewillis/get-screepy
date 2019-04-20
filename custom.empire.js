var utilities = require('custom.utilities');

// Structure type map
var structure_types = {
        'roads':[STRUCTURE_ROAD],
        'walls':[STRUCTURE_RAMPART,STRUCTURE_WALL],
        'towers':[STRUCTURE_TOWER],
        'containers':[STRUCTURE_CONTAINER],
        'storages':[STRUCTURE_STORAGE],
        'extensions':[STRUCTURE_EXTENSION],
        'spawns': [STRUCTURE_SPAWN],
        'controllers': [STRUCTURE_CONTROLLER],
        'construction_sites': []
};

// Functions
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


        // Add Remote Harvest Rooms Here

        /////////////////////// ROOMS ///////////////////////////

        // Create New Room Variables
        Memory.empire.rooms = {};
        for (const i in Game.spawns) {
            let spawn = Game.spawns[i];
            Memory.empire.rooms[spawn.room.name] = {};
        }

        // Populate Rooms
        for (let room_name in Memory.empire.rooms) {

            // Setup Room Object
            let room = Game.rooms[room_name];

            // Setup Empty Room Dictionaries
            Memory.empire.rooms[room_name].objects_at_position = {};
            Memory.empire.rooms[room_name].optimized_role_paths = {};

            // Setup algorithm variables
            let thing_by_id = {};

            ///////// STRUCTURE MAPPING

            // Setup Thing Specific Empty Variables
            for (let structure_type in structure_types) {
                Memory.empire.rooms[room_name][structure_type] = [];
                thing_by_id[structure_type] = {};
            }

            // Sort Out Structures (can be done decently often
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
                            thing_by_id[structure_type][struct.id] = struct;

                        }
                    }
                }

            });

            ///////// Optimal Wall Road Repair

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
                                closest_thing_id = current_thing_id;
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

            ////////// CONSTRUCTION SITES
            // Sort Out Structures (can be done decently often
            let structure_type = 'construction_sites';
            Memory.empire.rooms[room_name][structure_type] = [];
            room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {

                // Manually
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
                thing_by_id[structure_type][struct.id] = struct;

            });


            ////////// ENERGY SOURCES

            // Add Energy Sources
            Memory.empire.rooms[room_name].sources = [];
            room.find(FIND_SOURCES).forEach(function(source) {

                //Create Empty Source Object
                let source_obj = {};

                //Store ID
                source_obj.id = source.id;
                source_obj.harvest_pos_shorthand = null;
                source_obj.container_id = '';

                // Find Closest Empty Terrain
                for (let current_pos of source.pos.surround_grid()) {
                    let look_return = current_pos.look();
                    let containers = look_return.filter(function(look_object) {
                        if ('type' in look_object) {
                            if (look_object.type == 'constructionSite') {
                                if (look_object.constructionSite.structureType == STRUCTURE_CONTAINER) {
                                    return true;
                                } else {
                                    return false;
                                }
                            } else if (look_object.type == 'structure') {
                                if (look_object.structure.structureType == STRUCTURE_CONTAINER) {
                                    return true;
                                } else {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    });
                    if (containers.length==1) {
                        // We've found an empty position next to an energy source next to a container!
                        source_obj.harvest_pos_shorthand = current_pos.shorthand();
                        source_obj.container_id = containers[0].id;
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

            /////// BASE BUILDING (need to add rcl logic)

            /////// WALLS
            if (room.controller.level >= 2) {
                for (let i of [2,47]) {

                    let x_stretch = 0;
                    let y_stretch = 0;
    
                    for (let j = 2; j <= 47; j+=1) {
    
                        // X Stretch
                        let x_const = STRUCTURE_WALL;
                        if (x_stretch < 2) {
                            x_const = STRUCTURE_RAMPART;
                        }
                        let current_pos = new RoomPosition(i,j,room_name);
                        let something_there = false;
                        if (current_pos.shorthand() in Memory.empire.rooms[room_name].objects_at_position) {
                            for (let structure_type in structure_types) {
                                console.log('for ' + structure_type + ' at x:' + i + ' y:' + j + ' there is ' + Memory.empire.rooms[room_name].objects_at_position[current_pos.shorthand()][structure_type]);
                                if (Memory.empire.rooms[room_name].objects_at_position[current_pos.shorthand()][structure_type] !== '') {
                                    something_there = true;
                                }
                            }
                        }
                        if (!something_there) {
                            if (room.createConstructionSite(i,j,x_const) == OK) {
                                x_stretch+=1;
                                if (x_stretch>= 7) {
                                    x_stretch = 0;
                                }
                            } else {
                                x_stretch = 0;
                            }
                        } else {
                            x_stretch = 0;
                        }
                        
    
                        // Y Stretch
                        let y_const = STRUCTURE_WALL;
                        if (y_stretch < 2) {
                            y_const = STRUCTURE_RAMPART;
                        }
                        let current_pos_y = new RoomPosition(j,i,room_name);
                        let something_there_y = false;
                        if (current_pos_y.shorthand() in Memory.empire.rooms[room_name].objects_at_position) {
                            for (let structure_type in structure_types) {
                                if (Memory.empire.rooms[room_name].objects_at_position[current_pos_y.shorthand()][structure_type] !== '') {
                                    something_there_y = true;
                                }
                            }
                        }
                        if (!something_there_y) {
                            if (room.createConstructionSite(j,i,y_const) == OK) {
                                y_stretch+=1;
                                if (y_stretch>= 7) {
                                    y_stretch = 0;
                                }
                            } else {
                                y_stretch = 0;
                            }
                        } else {
                            y_stretch = 0;
                        }
    
                    }
                }
            }
            

            // Get Master Spawn
            let prime_spawn = null;
            for (let current_spawn_id of Memory.empire.rooms[room_name].spawns) {
                let current_spawn = Game.getObjectById(current_spawn_id);
                if ('spawn_status' in  current_spawn.memory) {
                    if (current_spawn.memory.spawn_status == 'master') {
                        prime_spawn = current_spawn;
                        break;
                    }
                } else {
                    prime_spawn = current_spawn;
                    break;
                }
            }

            /////// Surround master spawn in roads
            for (let current_pos of prime_spawn.pos.surround_grid()) {
                room.createConstructionSite(current_pos, STRUCTURE_ROAD);
            };

            /////// ROADS (somehow exits to roads need to be added)
            for (let structure_type in structure_types) {
                let needs_road = true;
                if (['roads','walls','construction_sites'].includes(structure_type)) {
                    continue;
                }

                for (let current_object_id of Memory.empire.rooms[room_name][structure_type]) {

                    // Don't build a road to yourself
                    if  (current_object_id == prime_spawn.id) {
                        continue;
                    }

                    // Get the object 
                    let current_object = thing_by_id[structure_type][current_object_id];

                    // Create path to object from spawn
                    let ret = PathFinder.search(
                        prime_spawn.pos,{pos:current_object.pos,range:1},
                        {
                            plainCost: 2,
                            swampCost: 2,
                            roomCallback: function(room_name) {
                                let room = Game.rooms[room_name];
                                if (!room) return;
                                let costs = new PathFinder.CostMatrix;
                                // Actual structures
                                room.find(FIND_STRUCTURES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {
                                        costs.set(struct.pos.x, struct.pos.y, 1);
                                    } else if (
                                        struct.structureType !== STRUCTURE_CONTAINER &&
                                        (struct.structureType !== STRUCTURE_RAMPART ||
                                        !struct.my)) {
                                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                                    }
                                });
                                // Include under construction things
                                room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {
                                        costs.set(struct.pos.x, struct.pos.y, 1);
                                    } else if (
                                        struct.structureType !== STRUCTURE_CONTAINER &&
                                        (struct.structureType !== STRUCTURE_RAMPART ||
                                        !struct.my)) {
                                        costs.set(struct.pos.x, struct.pos.y, 0xff);
                                    }
                                });
                                return costs;
                            }
                        }
                    );

                    // Add a road to all these spots in the path
                    for (let current_pos of ret.path) {
                            room.createConstructionSite(current_pos, STRUCTURE_ROAD);
                    };

                }

            }

            ///// BUILD EXTENSIONS and STORAGE and TOWER here (alternate northeast/southwest along roads) (though you may find doing it during road building is okay too
            //make a big array of things to be made and alternate along the road as their built



        }
    }
};
module.exports = empire;