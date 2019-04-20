var roleUpgrader = require('role.upgrader');
var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // Initialize Creep If Necessary
        if (!('build' in creep.memory)) {

            creep.memory.build = {};
            creep.memory.build.building = false;

        }

        if(creep.memory.build.building && creep.carry.energy == 0) {
            creep.memory.build.building = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.build.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.build.building = true;
            creep.say('🚧 build');
        }

        if(creep.memory.build.building) {
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {

                // Sort Targets (Finish one before starting the next)
                targets.sort(function(b,a) {
                    if (a.progress/a.progressTotal < b.progress/b.progressTotal) {
                        return -1;
                    } else if (a.progress/a.progressTotal > b.progress/b.progressTotal) {
                        return 1;
                    } else {
                        if (a.pos.getRangeTo(creep.pos) > b.pos.getRangeTo(creep.pos)) {
                            return -1;
                        } else if (a.pos.getRangeTo(creep.pos) < b.pos.getRangeTo(creep.pos)) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                });

                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                console.log(creep.name + ' has no builder tasks to do, switching to upgrader');
                roleUpgrader.run(creep);
            }
        } else {
            creep.getEnergy(true,true);
        }
    }
};

module.exports = roleBuilder;