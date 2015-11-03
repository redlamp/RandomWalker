var WalkerMain = function () {
    this.c = document.getElementById("walkerCanvas");
    this.ctx = c.getContext("2d");

    this.startX = Math.floor(c.width / 2);
    this.startY = Math.floor(c.height / 2);
    
    this.walkerCount = 10;
    this.stepDistance = 6;
    this.lineWidth = 4;
    
    this.walkers = createWalkers(walkerCount);
    this.activeWalkers = walkers.slice();
    
    draw();
};

var draw = function() {
    console.log("draw()");

    if(activeWalkers.length>0) {
        requestAnimationFrame(draw)
    }
    
    for(var i = 0; i < activeWalkers.length; i++) {
        w = activeWalkers[i];
        w.step();
        w.drawStep();
        if(!w.active){
            console.log(w.id+": removed");
            activeWalkers.splice(i,1);
        }
    }
}

var createWalkers = function(count) {
    var a = [];
    for (var i = 0; i < count; i++) {
        walker = new Walker(i);
        a.push(walker);
    }
    return a;
}

///////////////
//  WALKER   //
///////////////
var Walker = function (id) {
    this.id = id;
    var xPos = yPos = lastDrawnStep = 0;
    this.steps = [new Point()];
    this.lastStep = this.getStep;
    this.active = true;
    this.activeColor = "rgba(255, 0, 255, 0.005)";
    this.completeColor = "rgba(102, 17, 102, 0.005)";
};

Walker.prototype.step = function() {
//    console.log(this.id+": step()");
    
    var dirs = [0, 1, 2, 3];
    
//    if()
    
    var dir = this.lastDir = dirs[Math.floor(Math.random()*dirs.length)];
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
    
    if(p.x === 0 && p.y === 0){
        this.active = false;
    }
}

Walker.prototype.getStep = function (step) {
//    console.log(this.id+ ": getStep("+step+")");
    var s = step || this.steps.length - 1;
    return this.steps[s];
}

Walker.prototype.drawStep = function (step) {
//    console.log(this.id+": drawStep("+step+")");
    step = step || this.steps.length - 1;
    var x, y;
    l = this.getStep(step-1);
    s = this.getStep(step);
    
    x = startX + l.x * stepDistance;
    y = startY + l.y * stepDistance;
    ctx.moveTo(x, y);
    
    x = startX + s.x * stepDistance;
    y = startY + s.y * stepDistance;
    ctx.lineTo(x, y);
    
    ctx.lineCap = "square";
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = this.activeColor;
//    ctx.globalAlpha = 0.01;
    ctx.stroke();
}

//////////////
//  POINT   //
//////////////
var Point = function(x, y){
	this.x = x || 0;
	this.y = y || 0;
};
Point.prototype.clone = function(){
	return new Point(this.x, this.y);
};

//////////////
//  UTIL    //
//////////////
var stepToX = function (step) {
    s = this.getStep(step);
    x = startX + s.x * stepDistance;
}

var stepToY = function (step) {
    s = this.getStep(step);
    x = startY + s.y * stepDistance;
}
