/// <reference path="ScreepsAutocomplete-master\_references.js" />
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

// Create Spawn Function
StructureSpawn.prototype.update_creep_queue = 
    function() {

        // Get Variables
        let num_creeps = Object.keys(Game.creeps).length;

        // Something is wrong since all my creeps are dead
        if (num_creeps == 0) {
            this.memory.creep_creation_queue = [];
        }

        // Actual Queue Work (only if we have an empty queue to work with) 
        if (this.memory.creep_creation_queue.length == 0) {

            // Statics
            var room = this.room;
            var max_energy = room.energyCapacityAvailable;
            if (num_creeps <= 2) {
                console.log('num creeps of ' + num_creeps + ' is low!');
                max_energy = 300;
            }

            // Get Creeps That Belong To Me
            var creeps = _.filter(Game.creeps, (creep) => creep.memory.spawn == this.name);
            var creep_by_role = {};
            for (let role of list_of_roles) {
                creep_by_role[role] = _.filter(creeps, (creep) => creep.memory.role == role);
            }
            
            // Harvester Logic
            for (let energy_source of this.memory.energy_sources) {
                for (let harvest_location of energy_source.harvest_locations) {

                    // See if this harvest location has a creep assigned to it
                    let harvest_location_found = false;
                    for (let creep of creep_by_role['harvester']) {
                        if (creep.memory.harvest_location == null) {
                            console.log(creep.name + ' has a null harvest location');
                            harvest_location_found = true;
                        } else if (utilities.compare_RoomPositions(harvest_location,creep.memory.harvest_location)) {
                            harvest_location_found = true;
                        }
                    }
                    for (let creep of creep_by_role['harvester_static']) {
                        if (creep.memory.harvest_location == null) {
                            console.log(creep.name + ' has a null harvest location');
                            harvest_location_found = true;
                        } else if (utilities.compare_RoomPositions(harvest_location,creep.memory.harvest_location)) {
                            harvest_location_found = true;
                        }
                    }

                    // If it isn't we need to create a creep request
                    if (!harvest_location_found) {
                        if (max_energy>=800) {
                            // Mid Game Creep Harvester
                            this.memory.creep_creation_queue.push(
                                new creep_request_object(
                                    creep_body_optimizer(
                                        [CARRY], [WORK,WORK,WORK,WORK,WORK,CARRY], 2, max_energy
                                    ),
                                    this.name+'_screep-'+this.memory.screep_index++,
                                    {
                                        memory: {
                                            role: 'harvester_static',
                                            spawn: this.name,
                                            harvest_location: harvest_location,
                                            source_location: energy_source.source_location
                                        }
                                    }                                
                                )
                            );
                        } else {
                            // Early Game Creep Harvester
                            this.memory.creep_creation_queue.push(
                                new creep_request_object(
                                    creep_body_optimizer(
                                        [WORK], [CARRY,WORK], 2, max_energy
                                    ),
                                    this.name+'_screep-'+this.memory.screep_index++,
                                    {
                                        memory: {
                                            role: 'harvester',
                                            spawn: this.name,
                                            harvest_location: harvest_location,
                                            source_location: energy_source.source_location
                                        }
                                    }                                
                                )
                            );
                        }
                        
                    }

                    break; // One Per Energy Source

                }
            }

            // Everyone But Harvester For Now
            if (num_creeps > 0) {
                for (let creep_type in role_generic_information) {
                    if (creep_by_role[creep_type].length<role_generic_information[creep_type].max) {
                        console.log('adding a ' + creep_type + ' because ' + creep_by_role[creep_type].length + ' < ' + role_generic_information[creep_type].max);
                        this.memory.creep_creation_queue.push(
                            new creep_request_object(
                                creep_body_optimizer(
                                    role_generic_information[creep_type].priorities, role_generic_information[creep_type].other, role_generic_information[creep_type].speed, max_energy
                                ),
                                this.name+'_screep-'+this.memory.screep_index++,
                                {
                                    memory: {
                                        role: creep_type,
                                        spawn: this.name
                                    }
                                }                                
                            )
                        );
                    }
                }
            }

        }
    };

// Create Spawn Function 
StructureSpawn.prototype.spawn_creeps_if_necessary = 
    function() {
        
        // Get Variables
        var max_energy = this.room.energyCapacityAvailable;
        var num_creeps = Object.keys(Game.creeps).length;

        // Check for messed up situation
        if (num_creeps <= 2) {
            max_energy = 300;
        }

        // Check The Queue Size
        console.log('Queue size is ' + this.memory.creep_creation_queue.length);
        if (this.memory.creep_creation_queue.length > 0) {
            // Check if we're topped off
            if (this.room.energyAvailable >= max_energy) {
                // Check if were spawning something
                if (this.spawning == null) {
                    retVal = this.spawnCreep(
                        this.memory.creep_creation_queue[0].body, 
                        this.memory.creep_creation_queue[0].name,
                        this.memory.creep_creation_queue[0].opts
                    );
                    if(retVal == 0) {
                        console.log('Spawning new creep: ' + this.memory.creep_creation_queue[0].name);
                        this.memory.creep_creation_queue.shift();
                    }
                }
            }
        }

    };