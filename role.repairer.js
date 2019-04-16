/// <reference path="ScreepsAutocomplete-master\_references.js" />
var roleBuilder = require('role.builder');
var roleRepairer = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.repairing && creep.carry.energy == 0) {
            creep.memory.repairing = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.repairing && creep.carry.energy == creep.carryCapacity) {
            creep.memory.repairing = true;
            creep.say('🚧 repair');
        }

        if(creep.memory.repairing) {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: object => object.hits < object.hitsMax
            });
            if(targets.length) {
                targets.sort((a,b) => a.hits - b.hits);
                if(creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                console.log(creep.name + ' has no repair tasks to do, switching to builder');
                roleBuilder.run(creep);
            }
        }
        else {
            creep.getEnergy(true,false);
        }
    }
};

module.exports = roleRepairer;