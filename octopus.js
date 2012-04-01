window.onload = main;

var g_canvas;
var g_ctx;
var g_clock = 0;
// World scroll position.
var g_scrollX = 0;
var g_scrollY = 0;
var g_scrollIntX = 0;
var g_scrollIntY = 0;
var g_heightScale = 1;
var g_obstacles = [];
var g_inCollision = false;

var LEVEL_WIDTH = 1024;
var SIDE_LIMIT = 100;
var CAMERA_CHASE_SPEED = 0.2;
var OCTOPUS_RADIUS = 100;

function resizeCanvas() {
  if (g_canvas.height != g_canvas.clientHeight) {
    g_canvas.width = LEVEL_WIDTH;
    g_canvas.height = g_canvas.clientHeight;
  }
}

function getTime() {
  return (new Date()).getTime() * 0.001;
}

images = 
{
    urchin01:
    {
        url: "images/urchin1.png"
    },
    urchin02:
    {
        url: "images/urchin2.png"
    },
    background:
    {
        url: "images/BG_tile.png"
    },
	bodyHappy:
	{
		url: "images/octopus_body.png"
	},
	bodyNormal:
	{
		url: "images/octopus_body.png"
	},
	bodyDerp:
	{
		url: "images/octopus_body.png"
	},
	legTip:
	{
		url: "images/octopus_leg3.png"
	},
	legSegment1:
	{
		url: "images/octopus_leg1.png"
	},
	legSegment2:
	{
		url: "images/octopus_leg2.png"
	}
};

var LegsInfo = [
{ xOff:  0, yOff: -1, radius: 90, rotAccelInDeg: -20, rotationInDeg: 270 - 15 },
{ xOff:  1, yOff: -1, radius: 90, rotAccelInDeg: -10, rotationInDeg: 270 + 15 },
{ xOff:  1, yOff:  0, radius: 90, rotAccelInDeg:  -5, rotationInDeg: 0 - 30 - 15 },
{ xOff:  1, yOff:  1, radius: 90, rotAccelInDeg:  -5, rotationInDeg: 0 - 30 + 15 },
{ xOff:  0, yOff:  1, radius: 90, rotAccelInDeg:   5, rotationInDeg: 0 + 30 - 15 },
{ xOff: -1, yOff:  1, radius: 90, rotAccelInDeg:   5, rotationInDeg: 0 + 30 + 15 },
{ xOff: -1, yOff:  0, radius: 90, rotAccelInDeg:  10, rotationInDeg: 90 - 15 },
{ xOff: -1, yOff: -1, radius: 90, rotAccelInDeg:  20, rotationInDeg: 90 + 15 },
];

Obstacles = [
  {name:"urchin01", radius: 150},
  {name:"urchin02", radius: 150}
];

function main() {
  var requestId;
  g_canvas = document.getElementById("canvas");
  resizeCanvas();
  window.addEventListener('resize', resize, true);
  window.addEventListener('blur', pauseGame, true);
  window.addEventListener('focus', resumeGame, true);
  g_ctx = g_canvas.getContext("2d");
  LoadAllImages(images, mainLoop);

  OctopusControl.setLegs(LegsInfo);
  OctopusControl.setInfo(g_canvas.width / 2, g_canvas.height / 2, 0);

  MakeLevel();

  var then = getTime();
  function mainLoop() {
    var now = getTime();
    var elapsedTime = Math.min(0.1, now - then);
    then = now;
    g_clock += elapsedTime;

    update(elapsedTime);

    requestId = requestAnimFrame(mainLoop, g_canvas);
  }

  function resize() {
    resizeCanvas();
    update(0.0001);
  }

  function pauseGame() {
    if (requestId !== undefined) {
      cancelRequestAnimFrame(requestId);
      requestId = undefined;
    }
  }

  function resumeGame() {
    if (requestId === undefined) {
      mainLoop();
    }
  }
}

function MakeObstacle(type, x, y) {
  var obj = {
    x: x,
    y: y,
    type: type
  };
  g_obstacles.push(obj);
};

function MakeLevel() {
  var y = g_canvas.height;
  var width = g_canvas.width * 0.8;
  var xOff = Math.floor((g_canvas.width - width) * 0.5);
  for (var ii = 0; ii < 100; ++ii) {
    var x = xOff + pseudoRandInt(g_canvas.width);
    MakeObstacle(Obstacles[pseudoRandInt(Obstacles.length)], x, y);
    y += g_canvas.height;
  }
}

function CheckCollisions() {
  g_inCollision = false;
  var octoInfo = OctopusControl.getInfo();
  for (var ii = 0; ii < g_obstacles.length; ++ii) {
    var obj = g_obstacles[ii];
    var dx = obj.x - octoInfo.x;
    var dy = obj.y - octoInfo.y;
    //g_ctx.font = "12pt monospace";
    //g_ctx.fillStyle = "white";
    //g_ctx.fillText("dx: " + dx + " dy: " + dy, 10, 20);
    var rad = obj.type.radius + OCTOPUS_RADIUS;
    var radSq = rad * rad;
    var distSq = dx * dx + dy * dy;
    //g_ctx.fillText("dsq: " + distSq + " rSq: " + radSq, 10, 40);
    if (distSq < radSq) {
      g_inCollision = true;
      OctopusControl.shootBack(obj);
      break;
    }
  }
}

function drawBackground(ctx) {
  var img = images.background.img;
  var imageWidth = img.width;
  var imageHeight = img.height;
  var tilesAcross = (g_canvas.width + imageWidth - 1) / imageWidth;
  var tilesDown = (Math.floor(g_canvas.height / g_heightScale) + imageHeight - 1) / imageHeight;
  var sx = Math.floor(g_scrollX);
  var sy = Math.floor(g_scrollY);
  if (sx < 0) {
    sx = sx - (Math.floor(sx / imageWidth) + 1) * imageWidth;
  }
  if (sy < 0) {
    sy = sy - (Math.floor(sy / imageHeight) + 1) * imageHeight;
  }
  sx = sx % imageWidth;
  sy = sy % imageHeight;

  ctx.save();
  ctx.translate(-sx, -sy);
  for (var yy = -1; yy < tilesDown; ++yy) {
    for (var xx = -1; xx < tilesAcross; ++xx) {
      ctx.drawImage(img, xx * imageWidth, yy * imageHeight);
    }
  }
  ctx.restore();
}

function drawObstacles(ctx) {
  ctx.save();
  ctx.translate(-g_scrollIntX, -g_scrollIntY);
  for (var ii = 0; ii < g_obstacles.length; ++ii) {
    var obj = g_obstacles[ii];
    var img = images[obj.type.name].img;
    ctx.drawImage(
        img,
        obj.x - Math.floor(img.width / 2),
        obj.y - Math.floor(img.height / 2));
    //drawCircleLine(ctx, obj.x, obj.y, obj.type.radius, "white");
  }
  ctx.restore();
}

function update(elapsedTime) {
  CheckCollisions();
  OctopusControl.update(elapsedTime);
  var octoInfo = OctopusControl.getInfo();

  g_heightScale = g_canvas.clientWidth / g_canvas.width;
  g_ctx.save();
  g_ctx.scale(1, g_heightScale);

  var targetX = octoInfo.x - g_canvas.width / 2 - g_canvas.width / 4 * Math.sin(octoInfo.rotation);
  var targetY = octoInfo.y - g_canvas.height / 2 + g_canvas.height / 4 * Math.cos(octoInfo.rotation);
  //g_scrollX += (targetX - g_scrollX) * CAMERA_CHASE_SPEED;
  g_scrollY += (targetY - g_scrollY) * CAMERA_CHASE_SPEED;
  g_scrollIntX = Math.floor(g_scrollX);
  g_scrollIntY = Math.floor(g_scrollY);
  drawBackground(g_ctx);
  drawObstacles(g_ctx);

  g_ctx.save();
  g_ctx.translate(octoInfo.x - g_scrollIntX, octoInfo.y - g_scrollIntY);
  g_ctx.rotate(octoInfo.rotation);
  var legScrunches = [0, 10, 13, 5, 3, 7, 15, 10];
  drawLegs(15, legScrunches, g_ctx);
  drawOctopusBody(images.bodyNormal, 0, 0, octoInfo.rotation, g_ctx);
   for (var ii = 0; ii < LegsInfo.length; ++ii) {
     var legInfo = LegsInfo[ii];
     g_ctx.save();
     g_ctx.rotate(legInfo.rotation);
	 g_ctx.translate(0, 100);
   //   drawLeg(0, 0, 15, g_ctx);
     drawCircle(g_ctx, 0, 0, 15,
                g_clock < legInfo.upTime ? "rgb(255,0,255)" :"rgb(150, 0, 233)");
     g_ctx.restore();
   }
  // drawCircle(g_ctx, 0, 80, 10, "rgb(255,255,255)");
  // drawCircle(g_ctx, 0, 82, 5, "rgb(0,0,0)");
  //drawCircleLine(g_ctx, 0, 0, OCTOPUS_RADIUS, g_inCollision ? "red" : "white");
  g_ctx.restore();

  g_ctx.restore(); // for screen scale
}

function drawCircle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.fill();
}

function drawCircleLine(ctx, x, y, radius, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.stroke();
}

function LoadImage(url, callback)
{
	var image = new Image();
	image.onload = callback;
	image.src = url;
	return image;
}

function drawLegs(rotation, scrunches, ctx)
{
	for(var i = 0; i < 8; i++)
	{
		ctx.save();
		//left legs
		if(i < 2)
		{
			ctx.rotate(90 * Math.PI / 180);
			ctx.translate(15 + (-30) * i, 75);
		}
		//bottom legs
		else if(i < 6)
		{
			ctx.rotate(360 * Math.PI / 180);
			ctx.translate(100 + (-30 * i), 35);
		}
		//right legs
		else
		{
			ctx.rotate(270 * Math.PI / 180);
			ctx.translate(175 - (30 * i), 75);
		}
		drawLeg(0, 0, rotation, scrunches[i], ctx);
		ctx.restore();
	}
}

function drawLeg(baseX, baseY, rotation, scrunch, ctx)
{
	//define base variable position for each leg
	var base = 
	{
		x: baseX,
		y: baseY
	};
	var combineJoints = 5;
	//draw section
	// ctx.rotate(rotation * .3);
	ctx.save();
	ctx.drawImage(images.legSegment1.img, base.x, base.y);
	base.y = base.y + images.legSegment1.img.height - combineJoints - scrunch;
	base.x = base.x - scrunch;
	ctx.save();
	//draw another section
	scrunchRotation = Math.sin(scrunch / images.legSegment2.img.height);
	ctx.rotate(scrunchRotation);
	ctx.drawImage(images.legSegment2.img, base.x - scrunch, base.y);
	base.y = base.y + images.legSegment2.img.height - combineJoints - scrunch;
	base.x = base.x - scrunch;
	//draw tip
	// ctx.rotate(rotation * .3);
	ctx.save();
	ctx.drawImage(images.legTip.img, base.x - scrunch, base.y);
	base.y = base.y + images.legTip.img.height - combineJoints - scrunch;
	ctx.restore();
	ctx.restore();
	ctx.restore();
}

function drawOctopusBody(image, x, y, rotation, ctx)
{
	x = x - (image.img.width * .5);
	y = y - (image.img.height * .5);
	drawItem(image, x, y, rotation, ctx);
}

function drawItem(image, x, y, rotation, ctx)
{
	ctx.save();
//	ctx.rotate(rotation);
	ctx.drawImage(image.img, x, y);
	ctx.restore();
}

function MoveTentacle(tipPosX, tipPosY)
{
	var motionForce = -2;//magnitude
	//assumes first segment is the tip of the tentacle
	//move the tip
	var newPos = 
	{
		x: tipPosX - motionForce,
		y: tipPosY - motionForce
	};
	return newPos;
}

function LoadAllImages(images, callback)
{
	var count = 0;
	for(var name in images)
	{
		count++;
		images[name].img = LoadImage(images[name].url, 
			function()
			{
				count--; 
				if(count == 0)
				{
					callback();
				}
			}
		);
	}
}

