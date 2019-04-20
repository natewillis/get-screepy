var utilities = require('custom.utilities');

// Tics Per Body Part
var tics_per_body_part = 3;

// Body Part Costs
var body_order_priority = {
    "move": 10,
    "work": 2,
    "carry": 3,
    "attack": 4,
    "ranged_attack": 4,
    "heal": 4,
    "claim": 2,
    "tough": 0
}

// Body Part Sort
function compare_body_part(a,b){
    if (body_order_priority[a] < body_order_priority[b])
        return -1;
    if (body_order_priority[a] > body_order_priority[b])
        return 1;
    return 0;
}

// Order Priority
var body_part_cost = {
    "move": 50,
    "work": 100,
    "carry": 50,
    "attack": 80,
    "ranged_attack": 150,
    "heal": 250,
    "claim": 600,
    "tough": 10
}

function calculate_energy_from_body_array (body_array) {
    let energy = 0;
    for (let body_part of body_array) {
        energy += body_part_cost[body_part];
    }
    return energy;
}

function create_queue_parameters(room_name,rcl,game_state) {

    let queue_parameters = {};

    // Game State Independent Logic

    // Builder Logic (Only spawn a builder if there's something to build)
    let construction_sites = Game.rooms[room_name].find(FIND_CONSTRUCTION_SITES);
    if (construction_sites.length>0) {
        queue_parameters.builder = {
            repeat: ["work","carry","move"], //200
            core: ["work","carry","move"], //200
            max_energy: 100000,
            max_total: Math.ceil(construction_sites.length/6),
            priority: 10
        };
    }

    // Upgrader
    queue_parameters.upgrader = {
        repeat: ["carry","carry","move"], //150
        core: ["work","carry","move"], //200,
        max_energy: 100000,
        max_total: 1,
        priority: 9
    };

    // Road Repairer
    queue_parameters.road_repairer = {
        repeat: ["carry","carry","move"], //150
        core: ["work","carry","move"], //200,
        max_energy: 100000,
        max_total: 1,
        priority: 10
    };

    // Wall Repairer
    queue_parameters.wall_repairer = {
        repeat: ["carry","carry","carry","work","move","move"], //300
        core: ["work","carry","move"], //200,
        max_energy: 100000,
        max_total: Math.ceil(Memory.empire.rooms[room_name].walls.length/15),
        priority: 10
    };


    // Harvester/Spawn Manager Stuff
    let harvester_static_core = ["work","work","work","work","carry","move"];
    if (rcl>1 && Game.rooms[room_name].energyCapacityAvailable > calculate_energy_from_body_array(harvester_static_core)) {
        
        // We can do static harvester!
        queue_parameters.harvester_static ={
            repeat: ["work"], //0
            core: harvester_static_core, //600
            max_energy: 600,
            max_total: Memory.empire.rooms[room_name].sources.length,
            priority: 1
        };

        // Also need a spawn manager
        queue_parameters.spawn_manager = {
            repeat: ["carry","carry","move"], //150
            core: ["work","move"], //150
            max_energy: 300,
            max_total: 2,
            priority: 0
        };
        if (rcl>=5) {
            queue_parameters.spawn_manager.max_total = 3;
            queue_parameters.spawn_manager.max_energy = 600;
        }

    } else {

        // Simple Harvesters
        let sources = Memory.empire.rooms[room_name].sources.filter(function (source_obj) {
            return room_name == source_obj.harvest_pos_shorthand.substring(0,room_name.length)
        });

        // Add teh harvester
        queue_parameters.harvester = {
            repeat: ["work","carry"], //100
            core: ["work","carry","move"], //200
            max_energy: 100000,
            max_total: sources.length,
            priority: 0
        };

    }

    // Return New Queue Parmeters
    return queue_parameters;

}

// Creep Request Object
function creep_request_object(body,name,opts) {
    this.body = body;
    this.name = name;
    this.opts = opts;
    this.cost = calculate_energy_from_body_array(body);
}

// Creep Request Optimizer (2)
function creep_body_optimizer(core,repeat,max_energy) {
    
    // Init body
    var creep_body = [];

    // Add core if we can
    if (calculate_energy_from_body_array(creep_body.concat(core))<=max_energy) {

        // concat core
        creep_body = creep_body.concat(core);

        // Add repeat parts until weve gotten enough (only if core got added)
        if (repeat.length>0) {
            while (calculate_energy_from_body_array(creep_body.concat(repeat))<=max_energy) {
                creep_body = creep_body.concat(repeat);
            }
        }

    }

    // Sort it
    creep_body.sort(compare_body_part);

    // Return creep request object
    return creep_body;

}

var mainSpawner = {

    // Create Spawn Function
    update_creep_queue: function() {

        for (let room_name in Memory.empire.rooms) {

            // Store this reference in memory for easy coding
            let empire_room = Memory.empire.rooms[room_name];
            let room = Game.rooms[room_name];

            // Current room info
            let max_energy = room.energyCapacityAvailable;
            let rcl = Game.getObjectById(empire_room.controllers[0]).level;

            // Get Creeps That Belong To Me
            var creeps = _.filter(Game.creeps, (creep) => creep.memory.room == room_name);

            // Something is wrong since all my creeps are dead
            if (Object.keys(creeps).length < 2) {
                room.memory.creep_creation_queue = [];
                rcl = 1; // Set the rcl low to rebuild things
                max_energy = 300; // We should only count on the regeneration
            }

            // initialize queue if it doesn't exist
            if (typeof room.memory.creep_creation_queue == 'undefined') {
                room.memory.creep_creation_queue = [];
            }

            // Actual Queue Work (only if we have an empty queue to work with)
            if (room.memory.creep_creation_queue.length == 0) {

                // Create Queue Parameters
                let queue_parameters = create_queue_parameters(room_name,rcl,'');

                // Sort Creeps By Role
                var creep_by_role = {};
                for (let role in queue_parameters) {
                    creep_by_role[role] = _.filter(creeps, (creep) => creep.memory.role == role);
                }

                // Loop through parameters to create queue
                for (let role in queue_parameters) {

                    // Get parameter
                    let queue_parameter = queue_parameters[role];

                    // Only add it if we need it
                    if (creep_by_role[role].length < queue_parameter.max_total) {
                        // Get creep body for this queue parameter
                        let creep_body = creep_body_optimizer(queue_parameter.core,queue_parameter.repeat,Math.min(max_energy,queue_parameter.max_energy));

                        // Add it to the queue
                        if (creep_body.length>0) {
                            room.memory.creep_creation_queue.push(
                                new creep_request_object(
                                    creep_body,
                                    utilities.generate_screep_name(room_name,role),
                                    {
                                        memory: {
                                            role: role,
                                            birth_role: role,
                                            room: room_name
                                        }
                                    }
                                )
                            );
                        }
                    }
                }

                // Sort the queue
                room.memory.creep_creation_queue.sort(function (a,b) {
                    if (queue_parameters[a.opts.memory.role].priority < queue_parameters[b.opts.memory.role].priority)
                        return -1;
                    if (queue_parameters[a.opts.memory.role].priority > queue_parameters[b.opts.memory.role].priority)
                        return 1;
                    return 0;
                });

            }

        }
    }
}

module.exports = mainSpawner;