var roleBuilder = require('role.builder');
var roleWallRepairer = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // Init Variables
        let room = Game.rooms[creep.memory.room];

        // Initialize Creep If Necessary 
        if (!('wall_repairer' in creep.memory)) {

            // set the wall_repairer data structure
            creep.memory.wall_repairer = {};
            creep.memory.wall_repairer.optimum_path = [];
            creep.memory.wall_repairer.repairing = false;
            creep.memory.wall_repairer.desired_energy_level = 100000000000000;

        }

        if(creep.memory.wall_repairer.repairing && creep.carry.energy == 0) {
            creep.memory.wall_repairer.repairing = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.wall_repairer.repairing && creep.carry.energy == creep.carryCapacity) {
            creep.memory.wall_repairer.repairing = true;
            creep.say('🚧 repair');
        }

        if(creep.memory.wall_repairer.repairing) {

            // Fill in the path
            if (creep.memory.wall_repairer.optimum_path.length == 0) {
                creep.memory.wall_repairer.optimum_path = room.memory.optimized_role_paths.walls.slice();
                creep.memory.wall_repairer.optimum_path = creep.memory.wall_repairer.optimum_path.concat(creep.memory.wall_repairer.optimum_path.splice(0,Math.floor(Math.random() * (creep.memory.wall_repairer.optimum_path.length))));
                creep.memory.wall_repairer.desired_energy_level = 100000000000000;
                for (let current_target_id of creep.memory.wall_repairer.optimum_path) {
                    let current_target = Game.getObjectById(current_target_id);
                    if (current_target !== null) {
                        if (current_target.hits < creep.memory.wall_repairer.desired_energy_level) {
                            creep.memory.wall_repairer.desired_energy_level = current_target.hits;
                        }
                    }
                }
                creep.memory.wall_repairer.desired_energy_level += 1000;
            }

            let current_target = null;
            while(creep.memory.wall_repairer.optimum_path.length>0 && current_target == null) {
                current_target = Game.getObjectById(creep.memory.wall_repairer.optimum_path[0]);
                let rampart_extra = 0;
                if (current_target !== null) {
                    if (current_target.structureType == STRUCTURE_RAMPART) {
                        rampart_extra = 1000;
                    }
                }
                if (current_target == null) {
                    creep.memory.wall_repairer.optimum_path.shift();
                    current_target = null;
                } else if (current_target.hits >= (creep.memory.wall_repairer.desired_energy_level+rampart_extra)) {
                    creep.memory.wall_repairer.optimum_path.shift();
                    current_target = null;
                }
            }

            if(current_target !== null) {
                if(creep.repair(current_target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(current_target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        } else {
            creep.getEnergy(true,true);
        }
    }
};

module.exports = roleWallRepairer;