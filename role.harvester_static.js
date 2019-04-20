var utilities = require('custom.utilities');
var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        
        // Initialize Creep If Necessary
        if (!('harvest' in creep.memory)) {

            // Find a free energy source to harvest
            let source_obj = utilities.find_unassigned_energy_source_obj(creep.memory.room, false);

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
                creep.memory.harvest.container_id = '';
                creep.memory.harvest.construction_site_id = '';
                creep.memory.harvest.container_build_state = 'harvest';
            }

        }

        // Setup Variables
        let my_source = Game.getObjectById(creep.memory.harvest.source_id);
        let harvest_location = utilities.room_position_from_shorthand(creep.memory.harvest.harvest_pos_shorthand)

        // Update container from empire memory
        if (harvest_location.shorthand() in Memory.empire.rooms[creep.memory.room].objects_at_position) {
            creep.memory.harvest.container_id = Memory.empire.rooms[creep.memory.room].objects_at_position[harvest_location.shorthand()].containers;
        } else {
            creep.memory.harvest.container_id = '';
        }
        

        // Check if we're at the harvest location
        if (!harvest_location.isEqualTo(creep.pos)) {
            // Move To The Harvest Location
            creep.moveTo(harvest_location, {visualizePathStyle: {stroke: '#ffaa00'},reusePath: 10});
        } else {
            // Were where we need to be
            if (creep.memory.harvest.container_id == '') {

                console.log('container needs to be created!');
                let my_construction_site = null;
                if (creep.memory.harvest.construction_site_id !== '') {
                    my_construction_site = Game.getObjectById(creep.memory.harvest.construction_site_id);
                } else {
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
                    my_construction_site = look_return[0];
                    creep.memory.harvest.construction_site_id = my_construction_site.id;
                }
                

                // Check For State Change
                if (creep.carry.energy == creep.carryCapacity) {
                    creep.memory.harvest.container_build_state = 'build';
                } else if (creep.carry.energy == 0) {
                    creep.memory.harvest.container_build_state = 'harvest';
                }

                // Perform action based on state
                if (creep.memory.harvest.container_build_state == 'harvest') {
                    creep.harvest(my_source);
                } else {
                    let retval = creep.build(my_construction_site);
                }

                return;
                
            } else { // We have a container and we're at the source, lets harvest!

                // Get Container
                let my_container = Game.getObjectById(creep.memory.harvest.container_id);

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