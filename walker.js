function WalkerMain() {
	this.c = document.getElementById("walkerCanvas");
	this.ctx = c.getContext("2d");

	this.startX = Math.floor(c.width / 2);
	this.startY = Math.floor(c.height / 2);

	this.walkerCount = 128;
	this.stepDistance = 6;
	
	this.activeLineWidth = 4;
	this.completeLineWidth = .5;

	this.activeColor = "rgba(255, 128, 255, 0.05)"; //"rgba(255, 250, 250, 0.02)";
	this.completeColor = "rgba(157, 27, 125, 0.5)";
	
	this.walkers = createWalkers(walkerCount);
	this.activeWalkers = walkers.slice();
	this.completeWalkers = [];

	configFPS("fpsElement");

	this.play = false;
	document.getElementById("playToggle").innerHTML = play ? "PAUSE" : "PLAY";
//	draw();
}

function draw() {
	// console.log("draw()");
	var i, w;

//	ctx.clearRect(0, 0, c.width, c.height);

	// Active
	i = activeWalkers.length - 1;
	while (i >= 0) {
		// for(i in activeWalkers) {
		w = activeWalkers[i];
		w.step();
		
		w.beginDraw(true);
		w.drawStep();
//		w.drawAll();
		w.endDraw();
		
		if (!w.active) {
			completeWalkers.push(activeWalkers.splice(i, 1)[0]);
			w.currentLineWidth = this.completeLineWidth;
			w.currentColor = this.completeColor;
			w.beginDraw(false);
			w.drawAll();
			w.endDraw();
			console.log("remain: " + activeWalkers.length + " \tsteps: " + w.steps.length + "\tremoved\tid: " + w.id);
		}
		i--;
	}

//	// Complete
//	i = 0;
//	while (i < completeWalkers.length) {
//		// for(i in completeWalkers) {
//		w = completeWalkers[i];
//		w.beginDraw();
//		w.drawStep(w.steps.length - 1);
////		w.drawAll();
//		w.endDraw();
//		i++;
//	}

	if (play && activeWalkers.length > 0) {
		requestAnimationFrame(draw);
	}

	fps.display.innerHTML = fps.getFPS() + " fps";
}

function createWalkers(count) {
	var a = [];
	var i = 0;
	for (i; i < count; i++) {
		walker = new Walker(i);
		walker.drawStep();
		a.push(walker);
	}
	return a;
}

function playToggle() {
	play = !play;
	document.getElementById("playToggle").innerHTML = play?"PAUSE":"PLAY";
	draw();
}

//////////////
//	WALKER	//
//////////////
function Walker(id) {
	this.id = id;
	this.steps = [new Step(this, 0, ORIGIN.clone(), DIR_NONE)];
	this.active = true;
	this.currentLineWidth = activeLineWidth;
	this.currentColor = activeColor;
//	this.activeColor = "rgba(255, 250, 250, 0.05)";
//	this.completeColor = "rgba(255, 128, 255, 0.25)";
}
Walker.prototype.toString = function() {
	return "[Walker id: " + this.id + "]";
}
Walker.prototype.step = function() {
	// console.log(this.id+": step()");
	var last = this.getStep();
	var dirs = [];
	// Don't allow an immediate step backwards, make sure the walker stays in the canvas bounds.
	if (last.direction !== DIR_SOUTH && startY + stepDistance * (last.point.y - 1) >= 0) {dirs.push(DIR_NORTH); }
	if (last.direction !== DIR_NORTH && startY + stepDistance * (last.point.y + 1) <= c.height) {dirs.push(DIR_SOUTH); }
	if (last.direction !== DIR_EAST && startX + stepDistance * (last.point.x - 1) >= 0) {dirs.push(DIR_WEST); }
	if (last.direction !== DIR_WEST && startX + stepDistance * (last.point.x + 1) <= c.width) {dirs.push(DIR_EAST); }
	var dir = dirs[Math.floor(Math.random()*dirs.length)];

	var next = new Step(this, this.steps.length, dir, last.point.clone().add(dir));
	this.steps.push(next);

	if (next.point.equals(ORIGIN)) {
		this.active = false;
	}
}
Walker.prototype.getStep = function(step) {
	// return requested step, default: last step
	var s = step || this.steps.length - 1;
	// negative values return starting from the back to front.
	if (s < 0) {
		s = this.steps.length + s; 
	} 
	return this.steps[s];
}
Walker.prototype.stepAsX = function(step) {
	var p = this.getStep(step).point;
	return startX + stepDistance * p.x;
}
Walker.prototype.stepAsY = function(step) {
	var p = this.getStep(step).point;
	return startY + stepDistance * p.y;
}
Walker.prototype.beginDraw = function(active) {
	ctx.beginPath();
	ctx.lineCap = "butt";
	ctx.lineWidth = this.currentLineWidth;
	ctx.strokeStyle = this.currentColor;
}
Walker.prototype.endDraw = function () {
	ctx.stroke();
}
Walker.prototype.drawStep = function(step) {
	// console.log(this.id+": drawStep("+step+")");
	var s = this.getStep(step);
	var xBeg = xEnd = this.stepAsX(step);
	var yBeg = yEnd = this.stepAsY(step);

	switch(s.direction){
		case DIR_NORTH:
			yBeg += stepDistance - this.currentLineWidth / 2;
			yEnd -= this.currentLineWidth / 2;
			break;
		case DIR_SOUTH:
			yBeg -= stepDistance - this.currentLineWidth / 2;
			yEnd += this.currentLineWidth / 2;
			break;
		case DIR_EAST:
			xBeg -= stepDistance - this.currentLineWidth / 2;
			xEnd += this.currentLineWidth / 2;
			break;
		case DIR_WEST:
			xBeg += stepDistance - this.currentLineWidth / 2;
			xEnd -= this.currentLineWidth / 2;
			break;
		case DIR_NONE:
			xBeg -= 1;
	}
	ctx.moveTo(xBeg, yBeg);
	ctx.lineTo(xEnd, yEnd);
}
Walker.prototype.drawAll = function() {
	for (var i = 2; i < this.steps.length; i++) {
		this.drawStep(i);
	}
}
//////////////
//	STEP	//
//////////////
var Step = function(walker, count, direction, point) {
	return {
		walker:walker,
		count:count,
		direction:direction,
		point:point
	}
}

//////////////
//	POINT	//
//////////////
function Point (x, y){
	this.x = x || 0;
	this.y = y || 0;
}
Point.prototype.toString = function() {
	return "[Point x: "+this.x+", y: "+this.y+"]";
}
Point.prototype.add = function(v){
	return v ? new Point(this.x + v.x, this.y + v.y) : this;
}
Point.prototype.clone = function(){
	return new Point(this.x, this.y);
}
Point.prototype.degreesTo = function(v){
	var dx = this.x - v.x;
	var dy = this.y - v.y;
	var angle = Math.atan2(dy, dx); // radians
	return angle * (180 / Math.PI); // degrees
}
Point.prototype.distance = function(v){
	var x = this.x - v.x;
	var y = this.y - v.y;
	return Math.sqrt(x * x + y * y);
}
Point.prototype.equals = function(toCompare) {
	return this.x == toCompare.x && this.y == toCompare.y;
}

//////////////////
//	DIRECTIONS	//
//////////////////
var DIR_NORTH = new Point( 0, -1);
var DIR_EAST = new Point( 1, 0);
var DIR_SOUTH = new Point( 0, 1);
var DIR_WEST = new Point(-1, 0);
var DIR_NONE = new Point(0, 0);
var ORIGIN= new Point( 0, 0);

//////////////
//	UTIL	//
//////////////
configFPS = function(targetDisplay){
	this.fps = {
		display: document.getElementById(targetDisplay),
		startTime: 0,
		frameNumber: 0,
		getFPS: function() {
			this.frameNumber++;
			var d = new Date();
			d = d.getTime();
			currentTime = (d - this.startTime) / 1000;
			result = Math.floor((this.frameNumber / currentTime));
			if (currentTime>1) {
				this.startTime = new Date;
				this.startTime = this.startTime.getTime();
				this.frameNumber = 0;
			}
			return result;
		}
	}
}