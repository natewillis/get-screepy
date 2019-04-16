/// <reference path="ScreepsAutocomplete-master\_references.js" />
var roleBuilder = require('role.builder');
var utilities = require('custom.utilities');
var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        // Set the memory if its its first time through
        if (creep.memory.harvesting == null) {
            creep.memory.harvesting == true;
        }

        // Dectect State Changes
        if(creep.carry.energy == creep.carryCapacity && creep.memory.harvesting) {
            creep.memory.harvesting = false;
            creep.say('transfering');
        } else if (creep.carry.energy == 0 && !creep.memory.harvesting) {
            creep.memory.harvesting = true;
            creep.say('harvesting');
        }

        // Transfer logic
        if (creep.memory.harvesting == false) {

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
            if(targets.length > 0) {
                // Transfer Energy To Target
                if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                // Find Priority Two Targets
                var targets = room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_CONTAINER && 
                            structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
                    }
                });
                if(targets.length > 0) {
                    if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                } else {
                    // Switch Role Until We Have A Place To Put Energy
                    console.log(creep.name + ' has no harvest tasks to do, switching to builder')
                    roleBuilder.run(creep);
                }
            }
        } else {
            // Figure Out Where I'm Supposed To Be
            var harvest_location = new RoomPosition(creep.memory.harvest_location.x,creep.memory.harvest_location.y,creep.memory.harvest_location.roomName);
            var my_position = creep.pos;

            // Figure OUt If I'm There
            if (utilities.compare_RoomPositions(harvest_location,my_position)) {

                // I'm here! Get my source
                var source_location = new RoomPosition(creep.memory.source_location.x,creep.memory.source_location.y,creep.memory.source_location.roomName);
                var my_source = source_location.lookFor(LOOK_SOURCES)[0];

                // Mine That Shit
                if(creep.harvest(my_source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(my_source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }

            } else {
                // I'm not to my harvest position yet
                creep.moveTo(harvest_location, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
    }
};

module.exports = roleHarvester;