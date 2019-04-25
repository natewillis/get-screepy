var utilities = require('custom.utilities');
var salesman = require('custom.salesman');

// Constants
var my_username = 'reckless';

// Structure type map
var structure_types = {
    'roads':[STRUCTURE_ROAD],
    'walls':[STRUCTURE_RAMPART,STRUCTURE_WALL],
    'towers':[STRUCTURE_TOWER],
    'containers':[STRUCTURE_CONTAINER],
    'storages':[STRUCTURE_STORAGE],
    'extensions':[STRUCTURE_EXTENSION],
    'spawns': [STRUCTURE_SPAWN],
    'controllers': [STRUCTURE_CONTROLLER]
};

// Add Non Structure Room Variables
room_dict_types = Object.keys(structure_types).concat([
    'construction_sites',
    'sources'
]);

// Internal Functions
function structure_mapping(room_name) {

    // Logging
    console.log('The game decided it was time to update structure memory!');

    // Setup Room Variables
    let room = Game.rooms[room_name];

    // Set new updated time
    room.memory.structure_update_time = Game.time;

    // Clear Out Old Data/ Initialize
    room.memory.structures = {};
    for (let structure_type in structure_types) {
        room.memory.structures[structure_type] = [];
    }
    room.memory.objects_at_position = {};

    // Perform search
    room.find(FIND_STRUCTURES).forEach(function(struct) {

        // Store the various structures
        for (let structure_type in structure_types) {
            for (let structure_type_const of structure_types[structure_type]) {
                if (struct.structureType == structure_type_const) {

                    // Store Array Of Object Type
                    room.memory.structures[structure_type].push(struct.id);

                    // Store Obj At Position Stuff
                    if (!(struct.pos.shorthand() in room.memory.objects_at_position)) { // Init If Necessary

                        // Init Empty Shorthand Dict
                        room.memory.objects_at_position[struct.pos.shorthand()] = {};

                        // Add Empty space for all the types
                        for (let room_dict_type of room_dict_types) {
                            room.memory.objects_at_position[struct.pos.shorthand()][room_dict_type] = '';
                        }

                    }

                    // Add this specific instance to the position stuff
                    room.memory.objects_at_position[struct.pos.shorthand()][structure_type] = struct.id;

                }
            }
        }
    });
}

function event_log_parsing(room_name) {

    // Init return event log
    parsed_event_log = {
        'building': false,
        'roads-building': false,
        'walls-building': false,
        'attack': false
    }

    // Get the event log
    event_log = Game.rooms[room_name].getEventLog();

    // Search for attack events
    let attack_events = _.filter(event_log, {event: EVENT_ATTACK});
    if (attack_events.length>0) {
        parsed_event_log['attack'] = true;
    }

    // Search for build events
    let build_events = _.filter(event_log, {event: EVENT_BUILD});
    if (build_events.length>0) {
        parsed_event_log['building'] = true;
    }
    build_events = _.filter(build_events, function(o) { return utilities.cached_object_by_id(o.data.targetId) !== null; });
    console.log(JSON.stringify(build_events));
    let wall_build_events = _.filter(build_events, function(o) { return utilities.cached_object_by_id(o.data.targetId).structureType == STRUCTURE_WALL; });
    if (wall_build_events.length>0) {
        parsed_event_log['walls-building'] = true;
    }
    let road_build_events = _.filter(build_events, function(o) { return utilities.cached_object_by_id(o.data.targetId).structureType == STRUCTURE_ROAD; });
    if (road_build_events.length>0) {
        parsed_event_log['roads-building'] = true;
    }

    for (let parsed_event_key in parsed_event_log) {
        if (parsed_event_log[parsed_event_key]) {
            console.log('Event log shows ' + parsed_event_key + ' happened in ' + room_name);
        }
    }

    // return it
    return parsed_event_log;

}

function optimal_repair_paths(room_name, optimize_type) {

    // Logging
    console.log('running optimal repair path for '+ optimize_type + ' in ' + room_name);

    // Setup Room Variables
    let room = Game.rooms[room_name];
    let room_visual_points = [];

    // Check if I own this room 
    if (!room.controller.my) {
        console.log('I dont own ' + room_name + ' to create repair paths in');
        return;
    }

    // Set new updated time
    if (!('path_updated_time' in room.memory)) {
        room.memory.path_updated_time = {};
    }
    room.memory.path_updated_time[optimize_type] = Game.time;

    // Clear out old data
    if (!('optimized_role_paths' in room.memory)) {
        room.memory.optimized_role_paths = {};
    }
    room.memory.optimized_role_paths[optimize_type] = [];

    // Only run if theres enough things to run on it
    if (room.memory.structures[optimize_type].length>2) {

        // Populate points array
        let points = [];
        for (let current_thing_id of room.memory.structures[optimize_type]) {
            let current_thing = utilities.cached_object_by_id(current_thing_id);
            points.push(new salesman.Point(current_thing.pos.x,current_thing.pos.y));
        }

        // Run solver
        var solution = salesman.solve(points);

        // Create ordered point array
        room.memory.optimized_role_paths[optimize_type] = solution.map(i => room.memory.structures[optimize_type][i]);
        room.visual.poly(solution.map(i => [points[i].x,points[i].y]), {stroke: '#fff', strokeWidth: .15, opacity: .2, lineStyle: 'dashed'});

    } else {

        room.memory.optimized_role_paths[optimize_type] = room.memory.structures[optimize_type];

    }


}

function find_room_construction_sites(room_name) {

    // Logging
    console.log('The game decided it was time to update construction site memory!');

    // Setup Room Variables
    let room = Game.rooms[room_name];
    let structure_type = 'construction_sites';

    // Set new updated time
    room.memory.construction_site_update_time = Game.time;

    // Clear Out Old Data/ Initialize (Apply to position at time)
    room.memory[structure_type] = [];

    // Verify the object by position is initialized
    if (!('objects_at_position' in room.memory)) {
        room.memory.objects_at_position = {};
    }

    // Loop through structure search
    room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {

        // Store Array Of Object Type
        room.memory[structure_type].push(struct.id);

        // Store Obj At Position Stuff
        if (!(struct.pos.shorthand() in room.memory.objects_at_position)) { // Init If Necessary

            // Init Empty Shorthand Dict
            room.memory.objects_at_position[struct.pos.shorthand()] = {};

            // Add Empty space for all the types
            for (let room_dict_type of room_dict_types) {
                room.memory.objects_at_position[struct.pos.shorthand()][room_dict_type] = '';
            }

        }

        // Add this specific instance to the position stuff
        room.memory.objects_at_position[struct.pos.shorthand()][structure_type] = struct.id;

    });

}

function find_energy_sources(room_name) {

    // Logging
    console.log('The game decided it was time to update energy source site memory!');

    // Setup Room Variables
    let room = Game.rooms[room_name];
    let terrain = room.getTerrain();
    let structure_type = 'sources';

    // Set new updated time
    room.memory.sources_site_update_time = Game.time;

    // Clear Out Old Data/ Initialize (Apply to position at time)
    room.memory[structure_type] = [];

    // Loop through structure search
    room.find(FIND_SOURCES).forEach(function(source) {

        //Create Empty Source Object
        let source_obj = {};

        // Store Obj At Position Stuff
        if (!(source.pos.shorthand() in room.memory.objects_at_position)) { // Init If Necessary

            // Init Empty Shorthand Dict
            room.memory.objects_at_position[source.pos.shorthand()] = {};

            // Add Empty space for all the types
            for (let room_dict_type of room_dict_types) {
                room.memory.objects_at_position[source.pos.shorthand()][room_dict_type] = '';
            }

        }

        // Add this specific instance to the position stuff
        room.memory.objects_at_position[source.pos.shorthand()][structure_type] = source.id;

        //Store ID
        source_obj.id = source.id;
        source_obj.harvest_pos_shorthand = '';
        source_obj.container_id = '';

        // Find Closest Empty Terrain
        for (let current_pos of source.pos.surround_grid()) {

            if (current_pos.shorthand() in room.memory.objects_at_position) {
                source_obj.container_id = room.memory.objects_at_position[current_pos.shorthand()].containers;
                if (source_obj.container_id == '') {
                    let construction_site_id = source_obj.container_id = room.memory.objects_at_position[current_pos.shorthand()].construction_sites;
                    if (construction_site_id !== '') {
                        let construction_site = utilities.cached_object_by_id(construction_site_id);
                        if (construction_site.structureType == STRUCTURE_CONTAINER) {
                            source_obj.harvest_pos_shorthand = construction_site.pos.shorthand(); // Theres a container construction site
                            break;
                        }
                    }
                } else {
                    let container = utilities.cached_object_by_id(source_obj.container_id);
                    source_obj.harvest_pos_shorthand = container.pos.shorthand();
                    break; // Theres a container 
                }
            } else {
                // We've got nothing here
                if (terrain.get(current_pos.x,current_pos.y) !== TERRAIN_MASK_WALL) {
                    source_obj.harvest_pos_shorthand = current_pos.shorthand();
                }
            }

        }

        // This energy source has access to it so it counts
        if (source_obj.harvest_pos_shorthand !== '') {

            room.memory.sources.push(source_obj);

        }

    });

}


function wall_building(room_name) {

    // Logging
    console.log('The game decided it was time to update the walls!');

    // Setup Room Variables
    let room = Game.rooms[room_name];

    // Check if I own this room 
    if (!room.controller.my) {
        console.log('I dont own ' + room_name + ' to make walls in');
        return;
    }

    // Set new updated time
    room.memory.walls_update_time = Game.time;

    // Check for RCL to see if we should have walls 
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
                if (current_pos.shorthand() in room.memory.objects_at_position) {
                    for (let structure_type in room.memory.objects_at_position[current_pos.shorthand()]) {
                        if (room.memory.objects_at_position[current_pos.shorthand()][structure_type] !== '') {
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
                if (current_pos_y.shorthand() in room.memory.objects_at_position) {
                    for (let structure_type in room.memory.objects_at_position[current_pos_y.shorthand()]) {
                        if (room.memory.objects_at_position[current_pos_y.shorthand()][structure_type] !== '') {
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
}

function road_building(room_name) {

    // Logging
    console.log('The game decided it was time to update the roads!');

    // Setup Room Variables
    let room = Game.rooms[room_name];

    // Check if I own this room 
    if (!room.controller.my) {
        console.log('I dont own ' + room_name + ' to make roads in');
        return;
    }

    // Check for RCL to see if we should have walls 
    if (room.controller.level < 1) {
        console.log('Not high enough level for ' + room_name + ' to make roads in');
        return;
    }

    // Set new updated time
    room.memory.roads_update_time = Game.time;

    // Get Master Spawn
    let prime_spawn = null;
    for (let current_spawn_id of room.memory.structures.spawns) {
        let current_spawn = utilities.cached_object_by_id(current_spawn_id);
        if ('spawn_status' in current_spawn.memory) {
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
        if (!(current_pos.shorthand() in room.memory.objects_at_position)) {
            room.createConstructionSite(current_pos, STRUCTURE_ROAD);
        }
    };

    /////// ROADS (somehow exits to roads need to be added)
    for (let structure_type in structure_types) {
        
        let needs_road = true;
        if (['roads','walls'].includes(structure_type)) {
            continue;
        }

        for (let current_object_id of room.memory[structure_type]) {

            // Don't build a road to yourself
            if (current_object_id == prime_spawn.id) {
                continue;
            }

            // Get the object
            let current_object = utilities.cached_object_by_id(current_object_id);

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
}

function set_room_color(room_name) {

    // Logging
    console.log('The game decided it was time to update the room color!');

    // Setup Room Variables
    let room = Game.rooms[room_name];

    // Set owner of room
    if (room.controller.my) {
        room.memory.color = 'blue';
        room.memory.owner = my_username;
    } else {
        if (room.controller.owner && room.controller.owner.username) {
            room.memory.owner = room.controller.owner.username;
            room.memory.color = 'red';
        } else {
            if (room.controller.reservation && room.controller.reservation.username) {
                room.memory.owner = room.controller.reservation.username;
                if (room.controller.reservation.username == my_username) {
                    room.memory.color = 'blue';
                } else {
                    room.memory.color = 'red';
                }
            } else {
                room.memory.color = 'gray';
                room.memory.owner = '';
            }
        }
    } 
    room.memory.color_update_time = Game.time;

}

// Functions
var empire = {

    update_world_memory: function (force_refresh) {

        // Loop through rooms we have visibility into
        for (const i in Game.rooms) {

            // Set Variables
            let room = Game.rooms[i];
            let room_name = room.name;

            // Clear visuals from previous calls
            room.visual.clear();

            // Recheck room owner
            if (!('color_update_time' in room.memory)) {
                set_room_color(room_name);
            } else if ((Game.time-room.memory.color_update_time)>200) {
                set_room_color(room_name);
            }
            
            // Event Log Parsing
            event_log = event_log_parsing(room_name);

            // Construction sites
            if (!('construction_site_update_time' in room.memory)) {
                find_room_construction_sites(room_name);
            } else if ((Game.time-room.memory.construction_site_update_time)>5) {
                find_room_construction_sites(room_name);
            }

            // Structures (Also do energy sources due to container building)
            if (!('structure_update_time' in room.memory)) {
                structure_mapping(room_name);
                find_energy_sources(room_name);
            } else if (event_log['building'] && (Game.time-room.memory.structure_update_time)>5) {
                structure_mapping(room_name);
                find_energy_sources(room_name);
            } else if (!event_log['building'] && (Game.time-room.memory.structure_update_time)>200) {
                structure_mapping(room_name);
                find_energy_sources(room_name);
            }

            // Construction sites
            if (!('walls_update_time' in room.memory)) {
                wall_building(room_name);
            } else if ((Game.time-room.memory.walls_update_time)>200) {
                wall_building(room_name);
            }

            // Optimized path generation
            if (!('path_updated_time' in room.memory)) {
                for (let thing_type of ['roads','walls']) {
                    optimal_repair_paths(room_name,thing_type);
                }
            } else {
                for (let thing_type of ['roads','walls']) {
                    if (!(thing_type in room.memory.path_updated_time)) {
                        optimal_repair_paths(room_name,thing_type);
                    } else if (event_log[thing_type+'-building'] && (Game.time-room.memory.path_updated_time[thing_type])>10) {
                        optimal_repair_paths(room_name,thing_type);
                    } else if (!event_log[thing_type+'-building'] && (Game.time-room.memory.path_updated_time[thing_type])>200) {
                        optimal_repair_paths(room_name,thing_type);
                    }
                }
            }

        }

    }
};
module.exports = empire;