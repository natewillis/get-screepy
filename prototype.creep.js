var roles = {
    harvester: require('role.harvester'),
    harvester_static: require('role.harvester_static'),
    upgrader: require('role.upgrader'),
    builder: require('role.builder'),
    wall_repairer: require('role.wall_repairer'),
    road_repairer: require('role.road_repairer'),
    spawn_manager: require('role.spawn_manager'),
    scout_static: require('role.scout_static')
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
        var room = Game.rooms[this.memory.room];

        // if the Creep should look for containers
        if (useContainer) {

            // Storages get first priority
            if (room.storage !== undefined) {
                if(room.storage.store[RESOURCE_ENERGY] > 0) {
                    container = room.storage;
                }
            } else {// Regular containers get next priority
                containers = [];
                for (let container_id of room.memory.structures.containers) {
                    containers.push(Game.getObjectById(container_id));
                }
                containers = containers.filter(function(c) { return c.store[RESOURCE_ENERGY]>0;});
                if (containers.length>0) {
                    containers.sort(function(b,a) {
                        if (a.store[RESOURCE_ENERGY] < b.store[RESOURCE_ENERGY])
                            return -1;
                        if (a.store[RESOURCE_ENERGY] > b.store[RESOURCE_ENERGY])
                            return 1;
                        return 0;
                    })
                    container = containers[0];
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
            var room = Game.rooms[this.memory.room];
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