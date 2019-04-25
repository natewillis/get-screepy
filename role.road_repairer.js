var roleBuilder = require('role.builder');
var roleRoadRepairer = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // Variables
        let room = Game.rooms[creep.memory.room];

        // Initialize Creep If Necessary
        if (!('road_repairer' in creep.memory)) {

            // set the road_repairer data structure
            creep.memory.road_repairer = {};
            creep.memory.road_repairer.optimum_path = [];
            creep.memory.road_repairer.repairing = false;

        }

        if(creep.memory.road_repairer.repairing && creep.carry.energy == 0) {
            creep.memory.road_repairer.repairing = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.road_repairer.repairing && creep.carry.energy == creep.carryCapacity) {
            creep.memory.road_repairer.repairing = true;
            creep.say('🚧 repair');
        }

        if(creep.memory.road_repairer.repairing) {

            // Fill in the path
            if (creep.memory.road_repairer.optimum_path.length == 0) {
                creep.memory.road_repairer.optimum_path = room.memory.optimized_role_paths.roads.slice();
            }

            let current_target = null;
            while(creep.memory.road_repairer.optimum_path.length>0 && current_target == null) {
                current_target = Game.getObjectById(creep.memory.road_repairer.optimum_path[0]);
                if (current_target.hits == current_target.hitsMax) {
                    creep.memory.road_repairer.optimum_path.shift();
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

module.exports = roleRoadRepairer;