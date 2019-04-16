/// <reference path="ScreepsAutocomplete-master\_references.js" />
var roleUpgrader = require('role.upgrader');
var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if(creep.memory.building) {
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                console.log(creep.name + ' has no builder tasks to do, switching to upgrader');
                roleUpgrader.run(creep);
            }
        } else {
            creep.getEnergy(true,false);
        }
    }
};

module.exports = roleBuilder;