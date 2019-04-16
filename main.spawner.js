var mainSpawner = {

    /** @param {Game} game **/
    spawn: function(Game) {

        // Get Max Energy
        var max_energy = Game.room

        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
        var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
        var repairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'repairer');
        console.log('Harvesters: ' + harvesters.length + '\nUpgraders: ' + upgraders.length + '\nBuilders: ' + builders.length + '\nRepairers: ' + repairers.length);

        if(!Game.spawns['Spawn1'].spawning){
            if(harvesters.length < 5) {
                var newName = 'Harvester' + Game.time;
                retVal = Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE], newName,
                    {memory: {role: 'harvester'}});
                if(retVal == 0) {
                    console.log('Spawning new harvester: ' + newName);
                }
            } else if (upgraders.length < 1) {
                var newName = 'Upgrader' + Game.time;
                retVal = Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE], newName,
                    {memory: {role: 'upgrader'}});
                if(retVal == 0) {
                    console.log('Spawning new upgrader: ' + newName);
                }
            } else if (builders.length < 2) {
                var newName = 'Builder' + Game.time;
                retVal = Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE], newName,
                    {memory: {role: 'builder'}});
                if(retVal == 0) {
                    console.log('Spawning new builder: ' + newName);
                }
            } else if (repairers.length < 2) {
                var newName = 'Repairer' + Game.time;
                retVal = Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE,MOVE], newName,
                    {memory: {role: 'repairer'}});
                if(retVal == 0) {
                    console.log('Spawning new repairer: ' + newName);
                }
            }
        }

        if(Game.spawns['Spawn1'].spawning) {
            var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                spawningCreep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1,
                Game.spawns['Spawn1'].pos.y,
                {align: 'left', opacity: 0.8});
        }

    }

}

module.exports = mainSpawner;