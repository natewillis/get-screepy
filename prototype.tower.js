// create a new function for StructureTower
StructureTower.prototype.defend =
    function () {
        // find closes hostile creep
        var target = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        // if one is found...
        if (target != undefined) {
            // ...FIRE!
            console.log('attacking!');
            this.attack(target);
        } else {
            var target = this.pos.findClosestByRange(FIND_MY_CREEPS,{
                filter: s => s.hits < s.hitsMax
            });
            if (target != undefined) {
                this.heal(target);
            }
        }
    };