var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // Initialize Creep If Necessary
        if (!('upgrade' in creep.memory)) {

            creep.memory.upgrade = {};
            creep.memory.upgrade.upgrading = false;

        }

        // State Changes
        if(creep.memory.upgrade.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrade.upgrading = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.upgrade.upgrading && creep.carry.energy == creep.carryCapacity) {
            creep.memory.upgrade.upgrading = true;
            creep.say('⚡ upgrade');
        }

        // Execute state
        if(creep.memory.upgrade.upgrading) {
            if(creep.upgradeController(Game.rooms[creep.memory.room].controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(Game.rooms[creep.memory.room].controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        else {
            creep.getEnergy(true,true);
        }
    }
};

module.exports = roleUpgrader;