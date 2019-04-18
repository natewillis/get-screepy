var utilities = {

    compare_RoomPositions: function(room_position_1,room_position_2) {
        
        if (room_position_1.x == room_position_2.x && 
            room_position_1.y == room_position_2.y &&
            room_position_1.roomName == room_position_2.roomName) {
            return true;
        } else {
            return false;
        }
    },

    room_position_from_shorthand: function(shorthand) {

        // Perform REGEX
        var ret_array = shorthand.match(/^(.*)X(\d+)Y(\d+)$/);
        return new RoomPosition(parseInt(ret_array[2]),parseInt(ret_array[3]),ret_array[1]);

    },

    generate_screep_name: function(room_name,role) {

        // Figure Out Max Screep Value
        let creeps = _.filter(Game.creeps, (creep) => creep.memory.room == room_name && creep.memory.role == role);
        let current_indexes = creeps.map(creep => parseInt(creep.name.split("-"+role+"-")[1]));
        let max_index = 0;
        if (current_indexes.length>0) {
            max_index = Math.max(...current_indexes);
        }
        max_index+=1;

        // Return Name
        return room_name+'-' + role + '-' + max_index;

    },

    find_unassigned_energy_source_obj: function(room_name) {

        // Find a free energy source to harvest
        for (let source_object of Memory.empire.rooms[room_name].sources) {
            for (const i in Game.creeps) {
                let search_creep = Game.creeps[i];
                if (search_creep.memory.role == 'harvester' && search_creep.memory.room == room_name) {
                    if ('harvest' in search_creep.memory) {
                        if ('source_id' in search_creep.memory.harvest) {
                            if (search_creep.memory.harvest.source_id == source_object.id) {
                                return source_object;
                            }
                        }
                    }
                }
            }
        }

        // Return nothing since nothing is unassigned
        return null;

    }

};
module.exports = utilities;