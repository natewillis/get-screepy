/// <reference path="ScreepsAutocomplete-master\_references.js" />
var roleBuilder = require('role.builder');
var utilities = require('custom.utilities');
var roleSpawnManager = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // Initialize Memory
        if (typeof creep.memory.container_ids  == 'undefined') {
            creep.memory.container_ids = [];
        }

        // Find and store containers
        let containers = {};
        if (creep.memory.container_ids.length == 0) {
            // Harvester Logic
            for (let energy_source of Game.spawns[creep.memory.spawn].memory.energy_sources) {
                for (let harvest_location of energy_source.harvest_locations) {

                    // Check if this is a container
                    harvest_location = new RoomPosition(harvest_location.x,harvest_location.y,harvest_location.roomName);
                    
                    let look_return = harvest_location.lookFor(
                        LOOK_STRUCTURES
                    );
                    look_return = look_return.filter(function (structure) {
                        return structure.structureType == 'container';
                    });
                    if (look_return.length>0) {
                        creep.memory.container_ids.push(look_return[0].id);
                        containers[look_return[0].id] = look_return[0];
                    }
                }
            }
        } else {
            for (let container_id of creep.memory.container_ids) {
                containers[container_id] = Game.getObjectById(container_id);
            }
        }

        // Inialize States
        if (typeof creep.memory.manager_state  == 'undefined') {
            creep.memory.manager_state = 'retrieving';
            creep.memory.manager_target = creep.memory.container_ids[0];
        }

        // State Changes
        if (creep.carry.energy == creep.carryCapacity) {
            creep.memory.manager_state = 'distributing';
            creep.memory.manager_target = '';
        } else if (creep.carry.energy == 0) {
            creep.memory.manager_state = 'retrieving';
            sorted_ids = creep.memory.container_ids;
            sorted_ids.sort(function (b,a) {
                if (containers[a].store[RESOURCE_ENERGY] < containers[b].store[RESOURCE_ENERGY])
                    return -1;
                if (containers[a].store[RESOURCE_ENERGY] > containers[b].store[RESOURCE_ENERGY])
                    return 1;
                return 0;
            });
            creep.memory.manager_target = sorted_ids[0];
        }

        // Retrieval State
        if (creep.memory.manager_state == 'retrieving') {
            source_container = containers[creep.memory.manager_target];
            let retVal = creep.withdraw(source_container,RESOURCE_ENERGY);
            if(retVal == ERR_NOT_IN_RANGE) {
                creep.moveTo(source_container, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        } else if (creep.memory.manager_state == 'distributing') {
            // Find Priority One Targets
            var room = Game.spawns[creep.memory.spawn].room;
            var targets = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) && 
                        structure.energy < structure.energyCapacity;
                }
            });
            console.log('first level ' + JSON.stringify(targets));
            if(targets.length > 0) {
                // Transfer Energy To Target
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                // Find Priority Two Targets
                var targets = room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_STORAGE;
                    }
                });
                console.log(JSON.stringify(targets));
                if(targets.length > 0) {
                    console.log('I need to bring energy to the big one');
                    if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                } else {
                    // Switch Role Until We Have A Place To Put Energy
                    console.log(creep.name + ' has no harvest tasks to do, switching to builder')
                    roleBuilder.run(creep);
                }
            }
        }
    }
};

module.exports = roleSpawnManager;