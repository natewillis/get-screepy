var roleBuilder = require('role.builder');
var utilities = require('custom.utilities');
var roleSpawnManager = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // Initialize Manager
        if (!('spawn_manager' in creep.memory)) {
            creep.memory.spawn_manager = {}
            creep.memory.spawn_manager.state = 'retrieving';
            creep.memory.spawn_manager.target_id = '';
        }

        // State Changes
        if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.spawn_manager.state = 'distributing';
            creep.memory.spawn_manager.target_id = '';
        } else if (creep.carry.energy == 0) {
            creep.memory.spawn_manager.state = 'retrieving';
            creep.memory.spawn_manager.target_id = '';
        }

        // Execute States 
        if (creep.memory.spawn_manager.state == 'retrieving') {

            // If we have a target, verify it still has energy
            let target = null;
            if (creep.memory.spawn_manager.target_id !== '') {
                target = Game.getObjectById(creep.memory.spawn_manager.target_id);
                if (target.store[RESOURCE_ENERGY] == 0) {
                    creep.memory.spawn_manager.target_id = '';
                }
            }

            // If we have no target find one
            if (creep.memory.spawn_manager.target_id == '') {

                // Grab objects
                let containers = [];
                for (let container_id of Memory.empire.rooms[creep.memory.room].containers) {
                    let temp_container = Game.getObjectById(container_id);
                    if (temp_container.store[RESOURCE_ENERGY] > 0) {
                        containers.push(temp_container);
                    }
                }
                for (let storage_id of Memory.empire.rooms[creep.memory.room].storages) {
                    let temp_storage = Game.getObjectById(storage_id);
                    if (temp_storage.store[RESOURCE_ENERGY] > 0) {
                        containers.push(temp_storage);
                    }
                }

                containers.sort(function (b,a) {

                    if (a.structureType == b.structureType) {
                        if (a.store[RESOURCE_ENERGY] < b.store[RESOURCE_ENERGY]) {
                                return -1;
                        } else if (a.store[RESOURCE_ENERGY] > b.store[RESOURCE_ENERGY]) {
                                return 1;
                        } else {
                                return 0;
                        }
                    } else {
                        if (a.structureType == STRUCTURE_STORAGE) {
                                return -1;
                        } else {
                                return 1;
                        }
                    }

                });

                // Set Target
                if (containers.length > 0) {
                    target = containers[0];
                } else {
                    creep.getEnergy(true,true); // Fallback and harvest my own energy
                }

            }

            // Get Energy
            if (target !== null) {
                let retVal = creep.withdraw(target,RESOURCE_ENERGY);
                if(retVal == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }

        } else { // Distribute!
            // If we have a target, verify it still has capacity
            let target = null;
            if (creep.memory.spawn_manager.target_id !== '') {
                    target = Game.getObjectById(creep.memory.spawn_manager.target_id);
                    if ('storeCapacity' in target) {
                            if (target.store[RESOURCE_ENERGY] >= target.storeCapacity) {
                                    creep.memory.spawn_manager.target_id = '';
                            }
                    } else {
                            // Its a spawn/extension/tower 
                            if (target.energy >= target.energyCapacity) {
                                    creep.memory.spawn_manager.target_id = '';
                            }
                    }
            }

            // If we don't have a target, find one 
            if (creep.memory.spawn_manager.target_id == '') {

                // Setup Priorities
                let priorities = {
                    'spawns':2,
                    'extensions':1,
                    'towers':3,
                    'storages':4
                };
                let priority_structure_map = {
                    'spawn': 'spawns',
                    'extension': 'extensions',
                    'tower': 'towers',
                    'storage': 'storages'
                }

                // Setup array of potential targets
                let targets = [];
                for (let priority in priorities) {
                    for (let target_id of Memory.empire.rooms[creep.memory.room][priority]) {

                        // Get target object 
                        let cur_target = Game.getObjectById(target_id);

                        // Only add it if its not full
                        console.log('looking at ' + priority + ' with priority ' + priorities[priority_structure_map[cur_target.structureType]]);
                        if (utilities.energy_percent_full(cur_target)<1) {
                            console.log('adding ' + priority);
                            targets.push(cur_target);
                        }

                    }
                }
                console.log(JSON.stringify(targets));

                // Sort targets
                targets.sort(function (a,b) {
                    if(priorities[priority_structure_map[a.structureType]] == priorities[priority_structure_map[a.structureType]]) {

                        // Same structure, organize by energy percentage
                        if (utilities.energy_percent_full(a)<utilities.energy_percent_full(b)) {
                            return -1;
                        } else if (utilities.energy_percent_full(a)>utilities.energy_percent_full(b)) {
                            return 1;
                        } else {
                            // Find closest
                            if (a.pos.getRangeTo(creep.pos) < b.pos.getRangeTo(creep.pos)) {
                                return -1;
                            } else if (a.pos.getRangeTo(creep.pos) > b.pos.getRangeTo(creep.pos)) {
                                return 1;
                            } else {
                                return 0;
                            }
                        }

                    } else if (priorities[priority_structure_map[a.structureType]] < priorities[priority_structure_map[a.structureType]]) {
                        return -1;
                    } else if (priorities[priority_structure_map[a.structureType]] > priorities[priority_structure_map[a.structureType]]) {
                        return 1
                    }
                });

                // Set the best target
                if (targets.length>0) {
                    target = targets[0];
                }

            }

            // Distribute Energy
            if (target !== null) {
                if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }

        }
    }

};

module.exports = roleSpawnManager;