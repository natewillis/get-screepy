// Create a shorthand function
RoomPosition.prototype.shorthand =
    function () {
        return this.roomName+'X'+this.x+'Y'+this.y
    };

// Create a function that returns array of room positions around a single position
RoomPosition.prototype.surround_grid =
    function () {

        // Setup return array
        retArr = [];

        // Setup Bounds
        let minX = Math.max(this.x-1,0);
        let maxX = Math.min(this.x+1,49);
        let minY = Math.max(this.y-1,0);
        let maxY = Math.min(this.y+1,49);

        // Create Grid 
        for (let i = minX; i <= maxX; i++) {
            for (let j = minY; j <= maxY; j++) {
                if (i !== this.x || j !== this.y) {
                    retArr.push(new RoomPosition(i,j,this.roomName));
                }
            }
        }

        // Return it
        return retArr;

    };