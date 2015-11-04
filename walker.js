function WalkerMain () {
    this.c = document.getElementById("walkerCanvas");
    this.ctx = c.getContext("2d");

    this.startX = Math.floor(c.width / 2);
    this.startY = Math.floor(c.height / 2);
    
    this.walkerCount = 100;
    this.stepDistance = 6;
    this.lineWidth = 4;
    
    this.walkers = createWalkers(walkerCount);
    this.activeWalkers = walkers.slice();
    this.completeWalkers = [];
    
    this.play = true;
    draw();
};

function draw () {
//    console.log("draw()");
    var i, w;
    
    ctx.clearRect(0, 0, c.width, c.height);
    
    // Active
    i = activeWalkers.length-1;
    while (i >= 0) {
        w = activeWalkers[i];
        w.step();
        if(w.active) {
            w.beginDraw();
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
        w = completeWalkers[i];
//        console.log("w: "+w);
        w.beginDraw();
        w.drawAll();
        w.endDraw();
        i++;
    }
    
    if(play && activeWalkers.length>0) {
        requestAnimationFrame(draw)
    }
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
    console.log("PLAY: "+play);
    draw();
}

///////////////
//  WALKER   //
///////////////
function Walker (id) {
    this.id = id;
    var xPos = yPos = lastDrawnStep = 0;
    this.steps = [new Point()];
    this.active = true;
    this.activeColor = "rgba(255, 250, 250, 0.05)";
    this.completeColor = "rgba(255, 128, 255, 0.25)";
};
Walker.prototype.toString = function () {
    return "[Walker id: "+this.id+"]";
}
Walker.prototype.step = function() {
//    console.log(this.id+": step()");
    var dirs = [0, 1, 2, 3];
    var ban = [];
    
    var beg = this.getStep(-2);
    var end = this.getStep(-1);

    if(beg) {
        // Prevent vert backstep
        if (beg.y < end.y) {
            ban.push(0);
        }
        else if (beg.y > end.y) {
            ban.push(2);
        }
        // Prevent hor backstep
        if (beg.x < end.x) {
            ban.push(3);
        }
        else if (beg.x > end.x) {
            ban.push(1)
        }
    }
    // enforce low bounds
    if(this.stepAsX(-1) - stepDistance <= 0) {
        ban.push(3);
    }
    if(this.stepAsY(-1) - stepDistance <= 0) {
        ban.push(0);
    }
    // enforce high bounds
    if(this.stepAsX(-1) + stepDistance >= c.width) {
        ban.push(1);
    }
    if(this.stepAsY(-1) + stepDistance >= c.height) {
        ban.push(2);
    }
    
//    console.log("dirs pre ban:  "+dirs);
//    console.log("ban list:      "+ban);
    dirs = dirs.filter( function (e) {
        return ban.indexOf(e) < 0;
    })
//    console.log("dirs post ban: "+dirs);
    
    var dir = dirs[Math.floor(Math.random()*dirs.length)];
    var p = this.getStep(-1).clone();
    
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
//  POINT   //
//////////////
function Point (x, y){
	this.x = x || 0;
	this.y = y || 0;
};
Point.prototype.toString = function () {
    return "[Point x: "+this.x+", y: "+this.y+"]";
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

//////////////
//  UTIL    //
//////////////

