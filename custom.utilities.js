var utilities = {

    compare_RoomPositions: function(room_position_1,room_position_2) {
        
        if (room_position_1.x == room_position_2.x && 
            room_position_1.y == room_position_2.y &&
            room_position_1.roomName == room_position_2.roomName) {
            return true;
        } else {
            return false;
        }
    }

};
module.exports = utilities;