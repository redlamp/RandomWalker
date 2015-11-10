function WalkerMain () {
    this.c = document.getElementById("walkerCanvas");
    this.ctx = c.getContext("2d");

    this.startX = Math.floor(c.width / 2);
    this.startY = Math.floor(c.height / 2);
    
    this.walkerCount = 1;
    this.stepDistance = 6;
    this.lineWidth = 4;
    
    this.walkers = createWalkers(walkerCount);
    this.activeWalkers = walkers.slice();
    this.completeWalkers = [];
    
    configFPS("fpsElement");
    
    this.play = false;
    document.getElementById("playToggle").innerHTML = play?"PAUSE":"PLAY";
    draw();
};

function draw () {
//    console.log("draw()");
    var i, w;
    
    ctx.clearRect(0, 0, c.width, c.height);
    
    // Active
    i = activeWalkers.length-1;
    while (i >= 0) {
//    for(i in activeWalkers) {
        w = activeWalkers[i];
        w.step();
        if(w.active) {
            w.beginDraw();
//            w.drawStep(w.steps.length-1);
            w.drawAll();
            w.endDraw();
        } else {
            completeWalkers.push(activeWalkers.splice(i,1)[0]);
            console.log("remain: "+activeWalkers.length+" \tsteps: "+w.steps.length+"\tremoved\tid: "+w.id);
        }
        i--;
    }
    
    // Complete
    i = 0;
    while (i < completeWalkers.length) {
//    for(i in completeWalkers) {
        w = completeWalkers[i];
        w.beginDraw();
//        w.drawStep(w.steps.length-1);
        w.drawAll();
        w.endDraw();
        i++;
    }
    
    if(play && activeWalkers.length>0) {
        requestAnimationFrame(draw)
    }
    
    fps.display.innerHTML = fps.getFPS()+" fps";
}

function createWalkers (count) {
    var a = [];
    for (var i = 0; i < count; i++) {
        walker = new Walker(i);
        a.push(walker);
    }
    return a;
}

function playToggle () {
    play = !play;
    document.getElementById("playToggle").innerHTML = play?"PAUSE":"PLAY";
    draw();
}

///////////////
//  WALKER   //
///////////////
function Walker (id) {
    this.id = id;
    var xPos = yPos = lastDrawnStep = 0;
    this.steps = [ORIGIN.clone()];
    this.active = true;
    this.activeColor = "rgba(255, 250, 250, 0.05)";
    this.completeColor = "rgba(255, 128, 255, 0.25)";
};
Walker.prototype.toString = function () {
    return "[Walker id: "+this.id+"]";
}
Walker.prototype.step = function() {
//    console.log(this.id+": step()");
    var beg = this.getStep(-2);
    var end = this.getStep(-1).clone();
    var dirs = [];

    // Check that there's a prior position, don't allow an immediate step back, make sure the walker stays in the canvas bounds.
    if((!beg || beg.y >= end.y) && startY + (end.y-1) * stepDistance >= 0)          {/*console.log("N");*/ dirs.push(DIR_NORTH);}
    if((!beg || beg.y <= end.y) && startY + (end.y+1) * stepDistance <= c.height)   {/*console.log("S");*/ dirs.push(DIR_SOUTH);}
    if((!beg || beg.x >= end.x) && startX + (end.x-1) * stepDistance >= 0)          {/*console.log("W");*/ dirs.push(DIR_WEST);}
    if((!beg || beg.x <= end.x) && startX + (end.x+1) * stepDistance <= c.width)    {/*console.log("E");*/ dirs.push(DIR_EAST);}
    var dir = dirs[Math.floor(Math.random()*dirs.length)];
    end = end.add(dir);    
    this.steps.push(end);
    
    if(end.equals(ORIGIN)){
        this.active = false;
    }
}
Walker.prototype.getStep = function (step) {
//    console.log(this.id+ ": getStep("+step+")");
    var s = step || this.steps.length - 1;
    if (s < 0) {
      s = this.steps.length + s;  
    } 
    return this.steps[s];
}
Walker.prototype.stepAsX = function (step) {
    var p = this.getStep(step);
    return startX + stepDistance * p.x;
}
Walker.prototype.stepAsY = function (step) {
    var p = this.getStep(step);
    return startY + stepDistance * p.y;
}
Walker.prototype.beginDraw = function () {
    ctx.beginPath();
    ctx.lineCap = "square";
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = this.active ? this.activeColor : this.completeColor;
}
Walker.prototype.endDraw = function () {
    ctx.stroke();
}
Walker.prototype.drawStep = function (step) {
//    console.log(this.id+": drawStep("+step+")");
    ctx.moveTo(this.stepAsX(step-1), this.stepAsY(step-1));
    ctx.lineTo(this.stepAsX(step), this.stepAsY(step));
}

Walker.prototype.drawAll = function () {
    for (var i = 2; i < this.steps.length; i++) {
        this.drawStep(i);
    }
}
//////////////
//  STEP    //
//////////////
var Step = function (walker, count, point, direction) {
    return {
        walker:walker,
        count:count,
        point:point,
        direction:direction
    }
}

//////////////
//  POINT   //
//////////////
function Point (x, y){
	this.x = x || 0;
	this.y = y || 0;
};
Point.prototype.toString = function () {
    return "[Point x: "+this.x+", y: "+this.y+"]";
};
Point.prototype.add = function(v){
	return v ? new Point(this.x + v.x, this.y + v.y) : this;
};
Point.prototype.clone = function(){
	return new Point(this.x, this.y);
};
Point.prototype.degreesTo = function(v){
	var dx = this.x - v.x;
	var dy = this.y - v.y;
	var angle = Math.atan2(dy, dx); // radians
	return angle * (180 / Math.PI); // degrees
};
Point.prototype.distance = function(v){
	var x = this.x - v.x;
	var y = this.y - v.y;
	return Math.sqrt(x * x + y * y);
};
Point.prototype.equals = function(toCompare){
	return this.x == toCompare.x && this.y == toCompare.y;
};

//////////////////
//  DIRECTIONS  //
//////////////////
var DIR_NORTH = new Point( 0, -1);
var DIR_EAST  = new Point( 1,  0);
var DIR_SOUTH = new Point( 0,  1);
var DIR_WEST  = new Point(-1,  0);
var DIR_NONE = new Point(0, 0);
var ORIGIN= new Point( 0,  0);

//////////////
//  UTIL    //
//////////////
configFPS = function(targetDisplay){
    this.fps = {
    display: document.getElementById(targetDisplay),
    startTime: 0,
    frameNumber: 0,
    getFPS: function(){
        this.frameNumber++;
        var d = new Date();
        d = d.getTime();
        currentTime = (d - this.startTime) / 1000;
        result = Math.floor((this.frameNumber / currentTime));
        
        if(currentTime>1){
            this.startTime = new Date;
            this.startTime = this.startTime.getTime();
            this.frameNumber = 0;
        }
        return result;
    }
}
}