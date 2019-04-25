var utilities = {

    room_position_from_shorthand: function(shorthand) {

        // Perform REGEX
        var ret_array = shorthand.match(/^(.*)X(\d+)Y(\d+)$/);
        return new RoomPosition(parseInt(ret_array[2]),parseInt(ret_array[3]),ret_array[1]);

    },

    generate_screep_name: function(room_name,role) {

        // Figure Out Max Screep Value
        let creeps = _.filter(Game.creeps, (creep) => creep.memory.room == room_name && creep.memory.role == role);
        let current_indexes = creeps.map(creep => parseInt(creep.name.split("-"+role+"-")[1]) || 0);
        let max_index = 0;
        if (current_indexes.length>0) {
            max_index = Math.max(...current_indexes);
        }
        max_index+=1;

        // Return Name
        return room_name+'-' + role + '-' + max_index;

    },

    find_unassigned_energy_source_obj: function(room_name, stay_home) {

        // Create room object
        let room = Game.rooms[room_name];

        // Find a free energy source to harvest
        for (let source_object of room.memory.sources) {
            let assigned = false;
            for (const i in Game.creeps) {
                let search_creep = Game.creeps[i];
                if ((search_creep.memory.role == 'harvester' || search_creep.memory.role == 'harvester_static') && search_creep.memory.room == room_name) {
                    if ('harvest' in search_creep.memory) {
                        if ('source_id' in search_creep.memory.harvest) {
                            if (search_creep.memory.harvest.source_id == source_object.id) {
                                if (!stay_home || room_name == source_object.harvest_pos_shorthand.substring(0,room_name.length)) {
                                    assigned = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            if (!assigned) {
                return source_object;
            }
        }

        // Return nothing since nothing is unassigned
        return null;

    },

    find_unassigned_carrier_energy_source_obj: function(room_name) {

        // Find a free energy source to harvest
        for (let source_object of Memory.empire.rooms[room_name].sources) {
            if (room_name !== source_object.harvest_pos_shorthand.substring(0,room_name.length)) { // Needs to be an external room
                let assigned = false;
                for (const i in Game.creeps) {
                    let search_creep = Game.creeps[i];
                    if (search_creep.memory.role == 'long_range_carrier' && search_creep.memory.room == room_name) {
                        if ('long_range_carrier' in search_creep.memory) {
                            if ('source_id' in search_creep.memory.long_range_carrier) {
                                if (search_creep.memory.long_range_carrier.source_id == source_object.id) {
                                    assigned = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (!assigned) {
                    return source_object;
                }
            }
        }

        // Return nothing since nothing is unassigned
        return null;

    },

    energy_level: function(game_object) {
        if ('storeCapacity' in game_object) {
            return game_object.store[RESOURCE_ENERGY];
        } else if ('energy' in game_object) {
            return game_object.energy;
        }
    },

    energy_capacity: function(game_object) {
        if ('storeCapacity' in game_object) {
            return game_object.storeCapacity;
        } else if ('energy' in game_object) {
            return game_object.energyCapacity;
        }
    },

    energy_percent_full: function(game_object) {
        if ('storeCapacity' in game_object) {
            return (game_object.store[RESOURCE_ENERGY]/game_object.storeCapacity);
        } else if ('energy' in game_object) {
            return (game_object.energy/game_object.energyCapacity);
        }
    },

    cached_object_by_id: function(id) {
        
        if (typeof this.objects == 'undefined' ) {
            this.objects = {};
        }

        if (!(id in this.objects)) {
            this.objects[id] = Game.getObjectById(id);
        }

        return this.objects[id];

    }

};
module.exports = utilities; 