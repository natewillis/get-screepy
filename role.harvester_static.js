/// <reference path="ScreepsAutocomplete-master\_references.js" />
var utilities = require('custom.utilities');
var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        // Setup Variables
        let my_source;
        let source_location = new RoomPosition(creep.memory.source_location.x,creep.memory.source_location.y,creep.memory.source_location.roomName);
        let harvest_location = new RoomPosition(creep.memory.harvest_location.x,creep.memory.harvest_location.y,creep.memory.harvest_location.roomName);

        // Get energy source (and store it if we haven't already)
        if (typeof creep.memory.harvest_source_id  == 'undefined') {
            my_source = source_location.lookFor(LOOK_SOURCES)[0];
            creep.memory.harvest_source_id = my_source.id;
        } else {
            my_source = Game.getObjectById(creep.memory.harvest_source_id);
        }

        // Initialize Container ID
        if (typeof creep.memory.container_id  == 'undefined') {
            creep.memory.container_id = '';
        }

        // Figure out if we still need to build a container
        if (creep.memory.container_id == '') {
            let look_return = harvest_location.lookFor(
                LOOK_STRUCTURES
            )
            look_return = look_return.filter(function (structure) {
                return structure.structureType == 'container';
            });
            if (look_return.length>0) {
                creep.memory.container_id = look_return[0].id;
            }
        }

        // Check if we're at the harvest location
        if (!utilities.compare_RoomPositions(harvest_location,creep.pos)) {
            // Move To The Harvest Location
            creep.moveTo(harvest_location, {visualizePathStyle: {stroke: '#ffaa00'},reusePath: 10});
        } else {
            // Were where we need to be
            if (creep.memory.container_id == '') {
                console.log('container needs to be created!');
                let look_return = harvest_location.lookFor(LOOK_CONSTRUCTION_SITES);
                if (look_return.length == 0) {
                    // Create Construction Site For Container
                    if (Game.rooms[harvest_location.roomName].createConstructionSite(harvest_location,STRUCTURE_CONTAINER) !== OK) {
                        console.log(creep.name + ' couldnt build his construction site')
                        return;
                    } else {
                        look_return = harvest_location.lookFor(LOOK_CONSTRUCTION_SITES);
                    }
                }
                let my_construction_site = look_return[0];

                // Init Memory For The First Time
                if (typeof creep.memory.harvest_container_build_state  == 'undefined') {
                    creep.memory.harvest_container_build_state = 'harvest';
                }

                // Check For State Change
                if (creep.carry.energy == creep.carryCapacity) {
                    creep.memory.harvest_container_build_state = 'build';
                } else if (creep.carry.energy == 0) {
                    creep.memory.harvest_container_build_state = 'harvest';
                }

                // Perform action based on state
                if (creep.memory.harvest_container_build_state == 'harvest') {
                    creep.harvest(my_source);
                } else {
                    let retval = creep.build(my_construction_site);
                }

                return;
            } else { // We have a container and we're at the source, lets harvest!

                // Get Container
                let my_container = Game.getObjectById(creep.memory.container_id);

                // Check Container For Damage
                if (my_container.hits < my_container.hitsMax && creep.carry.energy == creep.carryCapacity) {
                    // Heal The Container
                    creep.repair(my_container);
                } else {
                    // Harvest
                    creep.harvest(my_source);
                }

            }
        }
    }
};

module.exports = roleHarvester;