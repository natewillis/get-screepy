var roles = {
    harvester: require('role.harvester'),
    harvester_static: require('role.harvester_static'),
    upgrader: require('role.upgrader'),
    builder: require('role.builder'),
    repairer: require('role.repairer'),
    spawn_manager: require('role.spawn_manager')
};

Creep.prototype.runRole =
    function () {
        if (!this.get_healing_if_necessary()) {
            roles[this.memory.role].run(this);
        }
    };

/** @function 
    @param {bool} useContainer
    @param {bool} useSource */
    Creep.prototype.getEnergy =
    function (useContainer, useSource) {
        /** @type {StructureContainer} */
        let container;

        // if the Creep should look for containers
        if (useContainer) {

            // Find Container For Refilling
            var room = Game.spawns[this.memory.spawn].room;
            var sources = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_STORAGE;
                }
            });
            if (sources.length>0) {
                container = sources[0];
            } else {
                var sources = room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_CONTAINER && 
                            structure.store[RESOURCE_ENERGY] > 0;
                    }
                });
                if (sources.length>0) {
                    sorted_indexes = [...Array(sources.length).keys()];
                    sorted_indexes.sort(function (b,a) {
                        if (sources[a].store[RESOURCE_ENERGY] < sources[b].store[RESOURCE_ENERGY])
                            return -1;
                        if (sources[a].store[RESOURCE_ENERGY] > sources[b].store[RESOURCE_ENERGY])
                            return 1;
                        return 0;
                    });
                    container = sources[sorted_indexes[0]];
                }
            }

            //Attempt to withdraw from it or move to it
            if (container != undefined) {
                var retVal = this.withdraw(container,RESOURCE_ENERGY);
                if(retVal == ERR_NOT_IN_RANGE) {
                    this.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }

        }
        // if no container was found and the Creep should look for Sources
        if (container == undefined && useSource) {
            // find closest source
            var source = this.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

            // try to harvest energy, if the source is not in range
            if (this.harvest(source) == ERR_NOT_IN_RANGE) {
                // move towards it
                this.moveTo(source);
            }
        }
    };

Creep.prototype.get_healing_if_necessary =
    function () {
        if (this.hits<this.hitsMax) {
            var room = Game.spawns[this.memory.spawn].room;
            var towers = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_TOWER;
                }
            });
            if (towers.length>0) {
                console.log('Im getting attacked and running back home!');
                this.moveTo(towers[0]);
            } else {
                console.log('im getting attacked with no tower to retreat to, dance!');
                this.move(Math.floor(Math.random() * Math.floor(8))+1);
            }
            return true;
        } else {
            return false;
        }
    };