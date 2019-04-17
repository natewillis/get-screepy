var utilities = require('custom.utilities');

// Prototype Specific Variables 
var list_of_roles = ['builder','repairer','harvester','upgrader','harvester_static','spawn_manager'];

// Static Role Counts
var role_generic_information = {
    'spawn_manager': {
        max: 1,
        priorities: ["carry"],
        other: [],
        speed: 2
    },
    'builder': {
        max: 1,
        priorities: ["work"],
        other: ["carry"],
        speed: 2
    },
    'repairer': {
        max: 3,
        priorities: ["work"],
        other: ["carry"],
        speed: 2
    },
    'upgrader': {
        max: 1,
        priorities: ["work"],
        other: ["carry"],
        speed: 2
    }
}

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

// Creep Request Object
function creep_request_object(body,name,opts) {
    Memory.screep_index += 1;
    this.body = body;
    this.name = name;
    this.opts = opts;
}

// Creep Request Optimizer (2)
function creep_body_optimizer(priorities,other_non_move_parts,plain_tic_per_move,max_energy) {
    var cur_energy = max_energy;
    var fatigue = 0;
    var energy_cost = 0;

    // Initialize Basic Screep
    var new_unit = {
        "move": 1,
        "work": 0,
        "carry": 0,
        "attack": 0,
        "ranged_attack": 0,
        "heal": 0,
        "claim": 0,
        "tough": 0
    };
    

    // Add Single Non Move Parts
    for (let other_non_move_part of other_non_move_parts) {
        new_unit[other_non_move_part] += 1;
    }
    for (let body_part_type in new_unit) {
        energy_cost += body_part_cost[body_part_type]*new_unit[body_part_type];
        if (body_part_type != "move") {
            fatigue += 2*new_unit[body_part_type];
        }
    }

    // Add priorities and associated moves until we're out of energy
    var added_something = true;
    while (added_something) {

        // Reset Loop Variable
        added_something = false;

        // Add Priorities
        for (let priority of priorities) {
            if ((energy_cost+body_part_cost[priority]) <= max_energy) {
                new_unit[priority] += 1;
                energy_cost += body_part_cost[priority];
                if (priority != "move") {
                    fatigue += 2;
                }
                added_something = true;
            }
        }

        // Add Moves To Keep Speed Up
        let added_speed = true;
        while (added_speed) {
            if ((fatigue/new_unit[MOVE])>plain_tic_per_move && (energy_cost+body_part_cost["move"]) < max_energy) {
                new_unit["move"] += 1;
                energy_cost += body_part_cost["move"];
                added_speed = true;
                added_something = true;
            } else {
                added_speed = false;
            }
        }
    }

    // Create Body Array
    var body = [];
    for (let body_part_type in new_unit) {
        if(new_unit[body_part_type]>0) {
            body = body.concat(Array(new_unit[body_part_type]).fill(body_part_type))
        }
    }
    body.sort(compare_body_part);

    // Return creep request object
    return body;

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
            if (Object.keys(creeps).length <= 2) {
                room.memory.creep_creation_queue = [];
                rcl = 1; // Set the rcl low to rebuild things
                max_energy = Math.max(300,room.energyAvailable);
            }

            // initialize queue if it doesn't exist
            if (typeof room.memory.creep_creation_queue == 'undefined') {
                room.memory.creep_creation_queue = [];
            }

            // Actual Queue Work (only if we have an empty queue to work with) 
            if (room.memory.creep_creation_queue.length == 0) {

                // Sort Creeps By Role
                var creep_by_role = {};
                for (let role of list_of_roles) {
                    creep_by_role[role] = _.filter(creeps, (creep) => creep.memory.role == role);
                }

                // Add Harvesters
                if (rcl <= 1) {
                    if (creep_by_role['harvester'].length < empire_room.sources.length) {
                        room.memory.creep_creation_queue.push(
                            new creep_request_object(
                                creep_body_optimizer(
                                    [WORK], [CARRY,WORK], 2, max_energy
                                ),
                                utilities.generate_screep_name(room_name,'harvester'),
                                {
                                    memory: {
                                        role: 'harvester',
                                        room: room_name
                                    }
                                }                      
                            )
                        );
                    }
                }

            }
            
        }
    }
}

module.exports = mainSpawner;