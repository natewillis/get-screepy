var utilities = require('custom.utilities');
var salesman = require('custom.salesman');

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
    'construction_sites'
]);
 
// Hardcode Functions (things that should be automated later)
function assign_external_rooms() {
    Memory.empire.controlled_rooms[''].enemy_rooms.push();
    Memory.empire.controlled_rooms[''].support_rooms.push();
}
 
// Internal Functions
function structure_mapping(room_name) {
               
    // Logging
    console.log('The game decided it was time to update structure memory!');

    // Setup Room Variables
    let room = Game.rooms[room_name];
    
    // Set new updated time
    room.memory.structure_update_time = Game.time;
    
    // Clear Out Old Data/ Initialize
    for (let structure_type in structure_types) {
        room.memory[structure_type] = [];
    }
    if (!('objects_at_position' in room.memory)) {
        room.memory.objects_at_position = {};
    } else {
        for (room_pos_shorthand in room.memory.objects_at_position) {
            for (let structure_type in structure_types) {
                room.memory.objects_at_position[room_pos_shorthand][structure_type] = '';
            }
        }
    }
    
    // Perform search
    room.find(FIND_STRUCTURES).forEach(function(struct) {

        // Store the various structures
        for (let structure_type in structure_types) {
            for (let structure_type_const of structure_types[structure_type]) {
                if (struct.structureType == structure_type_const) {
                
                    // Store Array Of Object Type
                    room.memory[structure_type].push(struct.id);
                    
                    // Store Obj At Position Stuff
                    if (!(struct.pos.shorthand() in room.memory.objects_at_position)) { // Init If Necessary
                    
                        // Init Empty Shorthand Dict
                        room.memory.objects_at_position[struct.pos.shorthand()] = {};
                        
                        // Add Empty space for all the types
                        for (let room_dict_type of room_dict_types) {
                            room.memory.objects_at_position[struct.pos.shorthand()][pos_init_structure_type] = '';
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
    let attack_events = _.filter(eventLog, {event: EVENT_ATTACK});
    if (attack_events.length>0) {
        parsed_event_log['attack'] = true;
    }

    // Search for build events
    let build_events = _.filter(eventLog, {event: EVENT_BUILD});
    if (build_events.length>0) {
        parsed_event_log['building'] = true;
    }
    let wall_build_events = _.filter(build_events, function(o) { return cached_object_by_id(o.targetId).structureType == STRUCTURE_WALL; });
    if (wall_build_events.length>0) {
        parsed_event_log['walls-building'] = true;
    }
    let road_build_events = _.filter(build_events, function(o) { return cached_object_by_id(o.targetId).structureType == STRUCTURE_ROAD; });
    if (road_build_events.length>0) {
        parsed_event_log['roads-building'] = true;
    }
    
    // return it
    return parsed_event_log;
               
}

function optimal_repair_paths(room_name, optimize_type) {

    // Logging
    console.log('running optimal repair path for '+ optimize_type + ' in ' + room_name);

    // Setup Room Variables
    let room = Game.rooms[room_name];
    
    // Set new updated time
    if (!('path_updated_time' in room.memory)) {
        room.memory.path_updated_time = {}
    }
    room.memory.path_updated_time[optimize_type] = Game.time;

    // Clear out old data
    if (!('optimized_role_paths' in room.memory)) {
        room.memory.optimized_role_paths = {}
    }
    room.memory.optimized_role_paths[optimize_type] = [];

    // Only run if theres enough things to run on it
    if (room.memory[optimize_type].length>2) {

        // Populate points array
        let points = [];
        for (let current_thing_id of room.memory[optimize_type]) {
            let current_thing = cached_object_by_id(current_thing_id);
            points.push(new salesman.Point(current_thing.pos.x,current_thing.pos.y));
        }

        // Run solver
        var solution  = salesman.solve(points);

        // Create ordered point array
        room.memory.optimized_role_paths[optimize_type] = solution.map(i => room.memory[optimize_type][i]);

    } else {

        room.memory.optimized_role_paths[optimize_type] = room.memory[optimize_type];

    }

}

function find_room_construction_sites(room_name) {

    // Logging
    console.log('The game decided it was time to update construction site memory!');

    // Setup Room Variables
    let room = Game.rooms[room_name];
    
    // Set new updated time
    room.memory.construction_site_update_time = Game.time;
    
    // Clear Out Old Data/ Initialize (Apply to position at time)
    room.memory[structure_type] = [];
    
    
    // Perform search
    room.find(FIND_STRUCTURES).forEach(function(struct) {


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

}
 
 
// Functions
var empire = {
 
    update_world_memory: function (force_refresh) {

        // Loop through rooms we have visibility into
        for (const j in Game.rooms) {
                        
            // Set Variables
            let room = Game.rooms[i];
            let room_name = room.name;
            
            // Event Log Parsing
            event_log = event_log_parsing(room_name);
            
            // Structures
            if (!('structure_update_time' in room.memory)) {
                structure_mapping(room_name);
            } else if (event_log['building'] && (Game.time-room.memory.structure_update_time)>5) {
                structure_mapping(room_name);
            } else if (!event_log['building'] && (Game.time-room.memory.structure_update_time)>200) {
                structure_mapping(room_name);
            }

            // Optimized path generation
            if (!('path_updated_time' in room.memory)) {
                for (let thing_type of ['roads','walls']) {
                    optimal_repair_paths(room_name,thing_type);
                }
            } else {
                for (let thing_type of ['roads','walls']) {
                    if (!(thing_type in room.memory.path_updated_time[thing_type])) {
                        optimal_repair_paths(room_name,thing_type);
                    } else if (event_log[thing_type+'-building'] && (Game.time-room.memory.path_updated_time[thing_type])>5) {
                        optimal_repair_paths(room_name,thing_type);
                    } else if (!event_log[thing_type+'-building'] && (Game.time-room.memory.path_updated_time[thing_type])>200) {
                        optimal_repair_paths(room_name,thing_type);
                    }
                }
            }

        }

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
        if (current_object_id == prime_spawn.id) {
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