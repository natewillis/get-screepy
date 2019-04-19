/// <reference path="ScreepsAutocomplete-master\_references.js" />
var roleBuilder = require('role.builder');
var utilities = require('custom.utilities');
var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        // Initialize Creep If Necessary
        if (!('harvest' in creep.memory)) {

            // Find a free energy source to harvest
            let source_obj = utilities.find_unassigned_energy_source_obj(creep.memory.room, true);

            // Uninitialze it if we didn't find anything
            if (source_obj == null) {
                console.log('NO FREE ENERGY SOURCES FOUND FOR HARVESTER!');
                return;
            } else {
                // set the harvest data structure
                creep.memory.harvest = {};
                creep.memory.harvest.source_id = source_obj.id;
                creep.memory.harvest.harvest_pos_shorthand = source_obj.harvest_pos_shorthand;
                creep.memory.harvest.harvesting = true;
            }

        }

        // Dectect State Changes
        if(creep.carry.energy == creep.carryCapacity && creep.memory.harvest.harvesting) {
            creep.memory.harvest.harvesting = false;
            creep.say('transfering');
        } else if (creep.carry.energy == 0 && !creep.memory.harvest.harvesting) {
            creep.memory.harvest.harvesting = true;
            creep.say('harvesting');
        }

        // Transfer logic
        if (!creep.memory.harvest.harvesting) {

            // Target Priorities
            let priorities = ['spawns','extensions','towers','containers','storages'];

            // go through priority list and find something to fill
            let fill_target = null;
            for (let priority of priorities) {


                // Go through objects of this type
                for (let structure_id of Memory.empire.rooms[creep.memory.room][priority]) {
                    let structure = Game.getObjectById(structure_id);
                    let has_room = false;
                    if ('energy' in structure) {
                        if (structure.energy < structure.energyCapacity) {
                            fill_target = structure;
                            break;
                        }
                    } else if ('storeCapacity' in structure) {
                        if (structure.store[RESOURCE_ENERGY] < structure.storeCapacity) {
                            fill_target = structure;
                            break;
                        }
                    }
                }

                if (fill_target !== null) {
                    break;
                }

            }

            // Fill the target we found
            if (fill_target !== null) {
                if(creep.transfer(fill_target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(fill_target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                // Switch Role Until We Have A Place To Put Energy
                console.log(creep.name + ' has no harvest tasks to do, switching to builder')
                roleBuilder.run(creep);
            }

        } else {

            // Figure Out Where I'm Supposed To Be
            var harvest_location = utilities.room_position_from_shorthand(creep.memory.harvest.harvest_pos_shorthand);
            var my_position = creep.pos;

            // Figure OUt If I'm There
            if (harvest_location.isEqualTo(my_position)) {

                // I'm here! Get my source
                var my_source = Game.getObjectById(creep.memory.harvest.source_id);

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