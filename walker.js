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
    
    this.play = false;
    this.playToggle();
};

var draw = function() {
    console.log("draw()");
    
//    ctx.clearRect(0,0,640,640);
    
    var i = activeWalkers.length-1;
    while (i >= 0) {
        w = activeWalkers[i];
        w.step();
        w.drawStep();
        if(!w.active) {
            activeWalkers.splice(i,1);
        }
        i--;
    }
    
    if(play && activeWalkers.length>0) {
        requestAnimationFrame(draw)
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

var playToggle = function () {
    play = !play;
    console.log("PLAY: "+play);
    draw();
}

///////////////
//  WALKER   //
///////////////
var Walker = function (id) {
    this.id = id;
    var xPos = yPos = lastDrawnStep = 0;
    this.steps = [new Point()];
    this.active = true;
    this.activeColor = "rgba(255, 0, 255, 0.005)";
    this.completeColor = "rgba(102, 17, 102, 0.005)";
};

Walker.prototype.step = function() {
//    console.log(this.id+": step()");
    
    var dirs = [0, 1, 2, 3];
    var ban = [];
    
    var beg = this.getStep(-2);
    var end = this.getStep(-1);

    if(beg) {
        // Prevent vert backstep
        if (beg.y < end.y)                  ban.push(0);
        else if (beg.y > end.y)             ban.push(2);

        // Prevent hor backstep
        if (beg.x < end.x)                  ban.push(3);
        else if (beg.x > end.x)             ban.push(1)
    }
    
    // enforce low bounds
    if(this.stepAsX(-1) - stepDistance <= 0)       ban.push(3);
    if(this.stepAsY(-1) - stepDistance <= 0)       ban.push(0);
    
    // enforce high bounds
    if(this.stepAsX(-1) + stepDistance >= c.width) ban.push(1);
    if(this.stepAsY(-1) + stepDistance >= c.height)ban.push(2);
    
    console.log("dirs pre ban:  "+dirs);
    console.log("ban list:      "+ban);
    dirs = dirs.filter( function (e) {
        return ban.indexOf(e) < 0;
    })
    console.log("dirs post ban: "+dirs);
    
    var dir = this.lastDir = dirs[Math.floor(Math.random()*dirs.length)];
    var p = this.getStep().clone();
    
    switch (dir){
        case 0: // UP
            p.y++;
            break;
        case 1: // RIGHT
            p.x++;
            break;
        case 2: // DOWN
            p.y--;
            break;
        case 3: // LEFT
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
    if (s < 0) s = this.steps.length + s;
    return this.steps[s];
}

Walker.prototype.stepAsX = function (step) {
    s = this.getStep(step);
    return startX + s.x * stepDistance;
}

Walker.prototype.stepAsY = function (step) {
    s = this.getStep(step);
    return startY + s.y * stepDistance;
}

Walker.prototype.drawStep = function (step) {
//    console.log(this.id+": drawStep("+step+")");
    s = step || this.steps.length - 1;
    var x, y;
    
    x = this.stepAsX(s-1);
    y = this.stepAsY(s-1);
    ctx.moveTo(x, y);
    
    x = this.stepAsX(s);
    y = this.stepAsY(s);
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
Point.prototype.toString = function () {
    return "[Point x: "+this.x+", y: "+this.y+"]";
};
Point.prototype.clone = function(){
	return new Point(this.x, this.y);
};

//////////////
//  UTIL    //
//////////////

