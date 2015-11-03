var WalkerMain = function () {
    this.c = document.getElementById("walkerCanvas");
    var ctx = c.getContext("2d");
    
    var startX = Math.floor(c.width/2);
    var startY = Math.floor(c.height/2);
    
    var walkerCount = 10;
    var stepDistance = 6;
    var strokeWidth = 4;
    
    var walkers = createWalkers(walkerCount);
};

var createWalkers = function(count) {
    var a = [];
    for (var i = 0; i < count; i++) {
        walker = new Walker(i);
        a.push(walker);
        walker.step();
        walker.draw();
    }
    return a;
}

var Walker = function (id) {
    this.id = id;
    var xPos = yPos = lastDrawnStep = 0;
    this.steps = [new Point()];
    var lastStep = this.getStep;
    var complete = false;
    var activeColor = "Magenta";
    var completeColor = "Purple";
};

Walker.prototype.step = function() {
    console.log(this.id+": step()");
    
    var dirs = [0, 1, 2, 3];
    
    // TODO: Remove restricted directions
    
    var dir = dirs[Math.floor(Math.random()*dirs.length)];
    var p = this.getStep().clone();
    
    switch (dir){
        case 0: // UP
//            console.log(this.id+": UP");
            p.y++;
            break;
        case 1: // RIGHT
//            console.log(this.id+": RIGHT");
            p.x++;
            break;
        case 2: // DOWN
//            console.log(this.id+": DOWN");
            p.y--;
            break;
        case 3: // LEFT
//            console.log(this.id+": LEFT");
            p.x--;
            break;
        default:
            console.log(this.id+": Couldn't step!");
    }
    
    this.steps.push(p);
}

Walker.prototype.getStep = function (step) {
//    console.log(this.id+ ": getStep("+step+")");
    var s = step || this.steps.length - 1;
    return this.steps[s];
}

Walker.prototype.draw = function () {
    console.log(this.id+": draw()");
    console.log("\tc: "+WalkerMain.c);
//    c.lineTo(startX + this.lastStep.x * stepDistance);
}

function Point(x, y){
	this.x = x || 0;
	this.y = y || 0;
};
Point.prototype.clone = function(){
	return new Point(this.x, this.y);
};
