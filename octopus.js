window.onload = main;

var HasLost = false;
var DistanceTraveled = 0;
var PrevPos = {x: 0, y: 0};
//make legs drift if the octopus is dead
var legDrift = .5;
var deathAnimDistance = 0;
var health = 9;
var g_canvas;
var g_ctx;
var g_clock = 0;
var g_bgm;
// World scroll position.
var g_scrollX = 0;
var g_scrollY = 0;
var g_scrollIntX = 0;
var g_scrollIntY = 0;
var g_heightScale = 1;
var g_baseScale = 1;
var g_obstacles = [];
var g_collectibles = [];
var g_inCollision = false;
var g_printMsgs = [];
var g_gameState = 'title';
var OPTIONS = {
  LEG_SCRUNCH: 11,
  LEG_SCRUNCH_SPEED: 90,
  LEG_UNSCRUNCH_SPEED: 20,
  LEVEL_WIDTH: 1024,
  SIDE_LIMIT: 100,
  CAMERA_CHASE_SPEED: 0.2,
  OCTOPUS_RADIUS: 85,
  INK_DURATION: 1,
  INK_LEAK_DURATION: 1.5,
  INK_COUNT: 10,
  INK_SCALE: 0.3,
  LEG_COMBINE_JOINTS: 11,
  LEG_FRICTION: 0.98,
  LEG_ROT_FRICTION: 0.98,
  LEG_ACCELERATION: 60,
  LEG_UP_DURATION: 0.8,
  SHOOT_BACK_VELOCITY: -500,
  URCHIN_SCALE1: .5,
  URCHIN_SCALE2: .8,
  COLLECTIBLE_SCALE: .5,
  URCHIN_SPAWN_RATE: .24,
};

getURLOptions(OPTIONS);

function print(msg) {
  if (OPTIONS.debug) {
    g_printMsgs.push(msg);
  }
}

function drawPrint(ctx) {
  ctx.font = "10pt monospace";
  ctx.fillStyle = "white";
  for (var ii = 0; ii < g_printMsgs.length; ++ii) {
    ctx.fillText(g_printMsgs[ii], 10, ii * 15 + 20);
  }
  g_printMsgs = [];
}

// return int from 0 to range - 1
function randInt(range) {
  return Math.floor(Math.random() * range);
}

function resizeCanvas() {
  if (g_canvas.height != g_canvas.clientHeight) {
    g_canvas.width = OPTIONS.LEVEL_WIDTH;
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
    ink01:
    {
        url: "images/ink01.png"
    },
    ink02:
    {
        url: "images/ink02.png"
    },
    background:
    {
        url: "images/BG_tile.png"
    },
	bodyHappy:
	{
		url: "images/octopus_body_yay.png"
	},
	bodyNormal:
	{
		url: "images/octopus_body.png"
	},
	bodyOw:
	{
		url: "images/octopus_body_ow.png"
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
	},
	collectible:
	{
		url: "images/inkdrop.png"
	},
	health0:
	{
		url: "images/inkbottle_1.png"
	},
	health1:
	{
		url: "images/inkbottle_2.png"
	},
	health2:
	{
		url: "images/inkbottle_3.png"
	},
	health3:
	{
		url: "images/inkbottle_full .png"
	},
	playAgain:
	{
		url: "images/playAgainButton.png"
	},
	outOfInk:
	{
		url: "images/OutofInk.png"
	},
	title:
	{
		url: "images/title.png"
	},
	tutorial:
	{
		url: "images/tutorial.png"
	},
	play:
	{
		url: "images/playbutton.png"
	}
};
var expression = 
{
	img: images.bodyNormal,
	timer: 0
};

var LegsInfo = [
{ scrunchDir: -1, xOff:  0, yOff:  80, radius: 90, rotAccelInDeg: -20, rotationInDeg: 270 - 15 },
{ scrunchDir: -1, xOff:  0, yOff:  80, radius: 90, rotAccelInDeg: -10, rotationInDeg: 270 + 15 },
{ scrunchDir: -1, xOff:  0, yOff:  55, radius: 90, rotAccelInDeg:  -5, rotationInDeg: 0 - 30 - 15 },
{ scrunchDir: -1, xOff:  0, yOff:  40, radius: 90, rotAccelInDeg:  -5, rotationInDeg: 0 - 30 + 15 },
{ scrunchDir:  1, xOff:  0, yOff:  40, radius: 90, rotAccelInDeg:   5, rotationInDeg: 0 + 30 - 15 },
{ scrunchDir:  1, xOff:  0, yOff:  55, radius: 90, rotAccelInDeg:   5, rotationInDeg: 0 + 30 + 15 },
{ scrunchDir:  1, xOff:  0, yOff:  80, radius: 90, rotAccelInDeg:  10, rotationInDeg: 90 - 15 },
{ scrunchDir:  1, xOff:  0, yOff:  80, radius: 90, rotAccelInDeg:  20, rotationInDeg: 90 + 15 },
];

Obstacles = [
  {name:"urchin01", radius: 125, scale: OPTIONS.URCHIN_SCALE1},//150 original
  {name:"urchin02", radius: 125, scale: OPTIONS.URCHIN_SCALE2}//scale should be .4 and .8
];

Sounds = {
  ouch: {
    filename: "sounds/hit.wav",
    samples: 3
  },
  swim: {
    filename: "sounds/swim.mp3",
    samples: 8
  },
  eat: {
    filename: "sounds/eat.wav",
    samples: 6
  },
  urchin: {
    filename: "sounds/urchin.wav",
    samples: 2
  },
};

function main() {
  connect();
  var requestId;
  g_canvas = document.getElementById("canvas");
  resizeCanvas();
  window.addEventListener('resize', resize, true);
  window.addEventListener('blur', pauseGame, true);
  window.addEventListener('focus', resumeGame, true);
  g_ctx = g_canvas.getContext("2d");
  LoadAllImages(images, mainLoop);

  var mySound = new buzz.sound( "sounds/octopus", {
	  formats: [ "ogg", "m4a", "wav" ]
  });

  mySound.play().loop();

 // g_bgm = $('bgm');
 // g_bgm.addEventListener('ended', function() {
 //     log("replay");
 //     this.currentTime = 0;
 //     this.play();
 // }, false);
  audio.init(Sounds);

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
    drawPrint(g_ctx);

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
    type: type,
  };
  g_obstacles.push(obj);
};

function MakeCollectible(x, y, radius)
{
	var obj = 
	{
		x: x,
		y: y,
	    type: {
		  radius: radius * OPTIONS.COLLECTIBLE_SCALE
		},
		radius: radius,
		isCollected: false
	};
	g_collectibles.push(obj);
}

function MakeLevel() {
  var y = g_canvas.height;
  var width = g_canvas.width * 0.8;
  var xOff = Math.floor((g_canvas.width - width) * 0.5);
  for (var ii = 0; ii < 100; ++ii) {
	//make obstacle
    var x = xOff + pseudoRandInt(g_canvas.width);
    MakeObstacle(Obstacles[pseudoRandInt(Obstacles.length)], x, y);
	OPTIONS.URCHIN_SPAWN_RATE -= .001;
    y += g_canvas.height * OPTIONS.URCHIN_SPAWN_RATE;
	//make collectible
	if(ii % 2 == 0)
	{
		MakeCollectible(pseudoRandInt(g_canvas.width), y + 33, images.collectible.img.width * .5);//
	}
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
    var rad = obj.type.radius * obj.type.scale + OPTIONS.OCTOPUS_RADIUS;
    var radSq = rad * rad;
    var distSq = dx * dx + dy * dy;
    //g_ctx.fillText("dsq: " + distSq + " rSq: " + radSq, 10, 40);
    if (distSq < radSq) {
      g_inCollision = true;
      OctopusControl.shootBack(obj);
      InkSystem.startInk(dx / 2, dy / 2);
      audio.play_sound('ouch');
      audio.play_sound('urchin');
	  health = health - 3;//take damage
	  //change expression
	  expression.img = images.bodyOw;
	  expression.timer = 35;
      break;
    }
  }
}

function CheckCollection()
{
	var octoInfo = OctopusControl.getInfo();
	var itemsToRemove = [];
	for(var ii = 0; ii < g_collectibles.length; ii++)
	{
		var obj = g_collectibles[ii];
		var dx = obj.x - octoInfo.x;
		var dy = obj.y - octoInfo.y;
		var rad = obj.radius + OPTIONS.OCTOPUS_RADIUS;
		var radSq = rad * rad;
		var distSq = dx * dx + dy * dy;
		
		if(distSq < radSq && !obj.isCollected)
		{
            audio.play_sound('eat');
			//collect stuffs!
			obj.isCollected = true;
			health++;//get healed a little
			if(health > 9)
			{
				health = 9;
			}
			itemsToRemove.push(ii);
			//change expression
			expression.img = images.bodyHappy;
			expression.timer = 35;
		}
	}
	//remove collected items
	for(var ii = 0; ii < itemsToRemove; ii++)
	{
		g_collectibles.splice(itemsToRemove[ii], 1);
	}
}

function drawBackground(ctx) {
  var img = images.background.img;
  var imageWidth = img.width;
  var imageHeight = img.height;
  var tilesAcross = (g_canvas.width / g_baseScale + imageWidth - 1) / imageWidth;
  var tilesDown = (Math.floor(g_canvas.height / g_baseScale / g_heightScale) + imageHeight - 1) / imageHeight;
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

function drawImageCentered(ctx, img, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.translate(-img.width * 0.5, -img.height * 0.5);
  //ctx.fillStyle = "purple";
  //ctx.fillRect(0, 0, img.width, img.height);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function drawHealthHUD(x, y, ctx)
{
	var hpCounter = health;
	ctx.save();
	ctx.translate(x, y);
	for(var ii = 0; ii < 3; ii++)
	{
		if(hpCounter >= 3)
		{
			ctx.drawImage(images.health3.img, 0, 0);
			hpCounter = hpCounter - 3;
		}
		else if(hpCounter >= 2)
		{
			ctx.drawImage(images.health2.img, 0, 0);
			hpCounter = hpCounter - 2;
		}
		else if(hpCounter >= 1)
		{
			ctx.drawImage(images.health1.img, 0, 0);
			hpCounter = hpCounter - 1;
		}
		else
		{
			ctx.drawImage(images.health0.img, 0, 0);
		}
		ctx.translate(images.health1.img.width, 0);
	}
	ctx.restore();
}

function drawObstacles(ctx) {
  for (var ii = 0; ii < g_obstacles.length; ++ii) {
    var obj = g_obstacles[ii];
    var img = images[obj.type.name].img;
    ctx.save();
    var scale = 0.9 + Math.sin((g_clock + ii) * 4) * 0.05;
    scale *= obj.type.scale;//here
    ctx.translate(obj.x, obj.y);
    ctx.scale(scale, scale);
    ctx.save();
    ctx.translate(-Math.floor(img.width / 2), -Math.floor(img.height / 2));
    ctx.drawImage(img, 0, 0);
    ctx.restore();
    if (OPTIONS.debug) {
      drawCircleLine(ctx, 0, 0, obj.type.radius, "white");
    }
    ctx.restore();
  }
}

function drawCollectibles(ctx)
{
	for(var i = 0; i < g_collectibles.length; i++)
	{
		var obj = g_collectibles[i];
		if(!obj.isCollected)
		{
			ctx.save();
			var img = images.collectible.img;
			var scale = OPTIONS.COLLECTIBLE_SCALE;//here
			ctx.translate(obj.x, obj.y);
			ctx.scale(scale, scale);
			ctx.save()
			ctx.translate(-Math.floor(img.width / 2), -Math.floor(img.height / 2));
			ctx.drawImage(img, 0, 0);
			ctx.restore();
			if (OPTIONS.debug) {
				drawCircleLine(ctx, 0, 0, obj.type.radius, "white");
			}
			ctx.restore();
		}
	}
	
}

legMovement = [0, 0, 0, 0, 0, 0, 0, 0];
legBackSwing = [false, false, false, false, false, false, false, false];
g_debounceTimer = 0;

function update(elapsedTime) {
	print("");
	//allow play again if the octopus is dead
	window.addEventListener('click', function(event) 
	{
		if (g_clock < g_debounceTimer) {
		  return;
		}

		g_debounceTimer = g_clock + 0.5;
		switch (g_gameState) {
		case 'title':
		  g_gameState = 'tutorial';
		  break;
		case 'tutorial':
		  g_gameState = 'play';
		  InputSystem.startInput();
		  break;
		case 'play':
		  break;
		case 'gameover':
		  window.location = window.location;
		  break;
		}
	});
	//check losing state
	if(health <= 0)
	{
		InputSystem.stopInput();
		HasLost = true;
		g_gameState = 'gameover';
	}

  CheckCollisions();
  CheckCollection();
  //don't move the octopus if it's dead
  if(!HasLost)
  {
    OctopusControl.update(elapsedTime);
  }
  var octoInfo = OctopusControl.getInfo();
  
  //track score
  DistanceTraveled += ((octoInfo.y - PrevPos.y) / 10) | 0;
  PrevPos.x = octoInfo.x;
  PrevPos.y = octoInfo.y;

  g_ctx.save();

  if (OPTIONS.battle) {
    var otherX = 512;
    var otherY = 512;
    var dx = otherX - octoInfo.x;
    var dy = otherY - octoInfo.y;
    var centerX = octoInfo.x + dx * 0.5;
    var centerY = octoInfo.y + dy * 0.5;


    g_heightScale = g_canvas.clientWidth / g_canvas.width;
    var screenWidth = 1024
    var screenHeight = g_canvas.height / g_heightScale;
    var adx = Math.abs(dx);
    var ady = Math.abs(dy);

    print("sw: " + screenWidth + " sh:" + screenHeight.toFixed(0));
    print("adx: " + adx.toFixed(0) + " ady: " + ady.toFixed(0));

    var halfScreenWidth = screenWidth / 2;
    var halfScreenHeight = screenHeight / 2;

    g_baseScale = 1;
    if (adx > halfScreenWidth) {
      g_baseScale = halfScreenWidth / adx;
    }
    if (ady > halfScreenHeight) {
      var yBaseScale = halfScreenHeight / ady;
      g_baseScale = Math.min(g_baseScale, yBaseScale);
    }

    print("bs: " + g_baseScale.toFixed(3));

    var targetX = centerX - g_canvas.width / g_baseScale / 2;
    var targetY = centerY - g_canvas.height / g_baseScale / g_heightScale / 2;

    g_scrollX += (targetX - g_scrollX) * OPTIONS.CAMERA_CHASE_SPEED;
    g_scrollY += (targetY - g_scrollY) * OPTIONS.CAMERA_CHASE_SPEED;

    g_ctx.scale(g_baseScale, g_baseScale * g_heightScale);
  } else {
    var targetX = octoInfo.x - g_canvas.width / 2 - g_canvas.width / 4 * Math.sin(octoInfo.rotation);
    var targetY = octoInfo.y - g_canvas.height / 2 + g_canvas.height / 4 * Math.cos(octoInfo.rotation);

    //g_scrollX += (targetX - g_scrollX) * OPTIONS.CAMERA_CHASE_SPEED;
    g_scrollY += (targetY - g_scrollY) * OPTIONS.CAMERA_CHASE_SPEED;

    g_heightScale = g_canvas.clientWidth / g_canvas.width;
    g_ctx.scale(1, g_heightScale);
  }


  g_scrollIntX = Math.floor(g_scrollX);
  g_scrollIntY = Math.floor(g_scrollY);
  drawBackground(g_ctx);

  if (g_gameState == "play" || g_gameState == "gameover") {

  g_ctx.save();
  g_ctx.translate(-g_scrollIntX, -g_scrollIntY);

  if (OPTIONS.battle && OPTIONS.debug) {
    drawCircle(g_ctx, otherX, otherY, 10, "yellow");
    drawCircle(g_ctx, centerX, centerY, 5, "green");
  }

  drawObstacles(g_ctx);
  drawCollectibles(g_ctx);

  g_ctx.save();
  g_ctx.translate(0, octoInfo.y);
  g_ctx.translate(octoInfo.x, 0);
  g_ctx.rotate(octoInfo.rotation);
  
  // drawCircle(g_ctx, 0, 0, 100, "rgb(200,0,255)");
  // only follow the octopus if you haven't yet lost
  if(HasLost)
  {
	//make the octopus fly up
	drawLegs(legMovement, g_ctx);
	drawOctopusBody(expression.img, 0, -deathAnimDistance, 0, g_ctx);
	if(deathAnimDistance < 500)
	{
		deathAnimDistance = deathAnimDistance + 4;
	}
	expression.timer = 100;
	g_ctx.restore();
  }
  else
  {
	  drawLegs(legMovement, g_ctx);
	  drawOctopusBody(expression.img, 0, 0, 0, g_ctx);
  }
  //change expression
  if(expression.timer > 0)
  {
	expression.timer--;
  }
  else
  {
	expression.timer = 0;
	expression.img = images.bodyNormal;
  }
  for (var ii = 0; ii < LegsInfo.length; ++ii) {
	var legInfo = LegsInfo[ii];
	//start leg animation
	if(legInfo.upTime > g_clock)
	{
		// legMovement[ii] = 11;
		legBackSwing[ii] = true;
	}
	//increment leg animation
	if(legBackSwing[ii] == true)
	{
		legMovement[ii] += OPTIONS.LEG_SCRUNCH_SPEED * elapsedTime;
	}
	//check to see if leg backswing is done
	if(legMovement[ii] > OPTIONS.LEG_SCRUNCH)
	{
		legMovement[ii] = OPTIONS.LEG_SCRUNCH;
		legBackSwing[ii] = false;
	}
	//decrement leg animation
	if(legMovement[ii] > 0)
	{
		legMovement[ii] -= OPTIONS.LEG_UNSCRUNCH_SPEED * elapsedTime;
	}
    // var legInfo = LegsInfo[ii];
    // g_ctx.save();
    // g_ctx.rotate(legInfo.rotation);
	// g_ctx.translate(0, 100);
	// // drawLeg(0, 0, 15, g_ctx);
    // drawCircle(g_ctx, 0, 0, 15,
               // g_clock < legInfo.upTime ? "rgb(255,0,255)" :"rgb(150, 0, 233)");
    // g_ctx.restore();
  }
  // drawCircle(g_ctx, 0, 80, 10, "rgb(255,255,255)");
  // drawCircle(g_ctx, 0, 82, 5, "rgb(0,0,0)");
  if (OPTIONS.debug) {
    drawCircleLine(g_ctx, 0, 0, OPTIONS.OCTOPUS_RADIUS, g_inCollision ? "red" : "white");
  }
  g_ctx.restore();

  InkSystem.drawInks(g_ctx, elapsedTime);
  g_ctx.restore(); // scroll

  } // endif g_gamestate

  if (g_gameState == "play" || g_gameState == "gameover") {
	drawHealthHUD(20, 20, g_ctx);//hud should follow octo translate but not rotation
  }
  if(HasLost)
  {
	//display ending splash screen
	drawImageCentered(g_ctx, images.outOfInk.img, g_canvas.width / 2, g_canvas.height / 5);
	drawImageCentered(g_ctx, images.playAgain.img, g_canvas.width / 2, g_canvas.height / 5 + 150);
	g_ctx.font = "20pt monospace";
    g_ctx.fillStyle = "white";
	g_ctx.fillText("You crawled "+DistanceTraveled+" tentacles before exploding!", 
		g_canvas.width / 4.6, g_canvas.height / 3 + 100);
  }

  switch (g_gameState) {
  case 'title':
	var h = g_canvas.height * 0.5 - (images.title.img.height + images.play.img.height) * 0.5;
	h /= g_heightScale;
	var h = g_canvas.height * 0.5 / g_heightScale;
	print("")
	print("gs:" + g_heightScale);
	print("h:" + h);
	drawImageCentered(g_ctx, images.title.img, g_canvas.width / 2, g_canvas.height / 4);
    drawImageCentered(g_ctx, images.play.img, g_canvas.width / 2, g_canvas.height / 4 + 250);
	break;
  case 'tutorial':
	drawImageCentered(g_ctx, images.tutorial.img, g_canvas.width / 2, g_canvas.height / 4);
	break;
  }

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

function drawLegs(scrunches, ctx)
{
	for(var i = 0; i < 8; i++)
	{
        var info = LegsInfo[i];
		ctx.save();
        ctx.rotate(info.rotation);
        ctx.translate(info.xOff, info.yOff);
//		//right legs
//		if(i < 2)
//		{
//			ctx.rotate(270 * Math.PI / 180);
//			ctx.translate(0 + (-30) * i, 75);
//		}
//		//bottom legs
//		else if(i < 6)
//		{
//			ctx.rotate(360 * Math.PI / 180);
//			ctx.translate(100 + (-30 * i), 35);
//		}
//		//left legs
//		else
//		{
//			ctx.rotate(90 * Math.PI / 180);
//			ctx.translate(195 - (30 * i), 75);
//		}
		//make legs drift after death
		if(HasLost)
		{
			ctx.translate(legDrift, legDrift);
		}
		drawLeg(0, 0, scrunches[i] * info.scrunchDir + info.scrunchDir, i, ctx);
		ctx.restore();
	}
	if(HasLost)
	{
		legDrift = legDrift + 1;
	}
}

function drawLeg(baseX, baseY, scrunch, legNdx, ctx)
{
	//define base variable position for each leg
	var base = 
	{
		x: baseX - scrunch,
		y: baseY - scrunch
	};

    var s = (scrunch > 0 ? 1 : -1)
    //scrunch = OPTIONS.LEG_SCRUNCH * s - scrunch;
    scrunch += Math.sin(g_clock + legNdx);

	ctx.save();
	ctx.rotate((scrunch * 5) * Math.PI / 180);
	ctx.translate(baseX, baseY);

    var img = images.legSegment1.img;
    ctx.save();
    ctx.translate(-img.width / 2, 0);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

	ctx.translate(0, img.height - scrunch - OPTIONS.LEG_COMBINE_JOINTS);
    scrunch += Math.sin(g_clock + legNdx + 1);
	ctx.rotate((scrunch * 10) * Math.PI / 180);

    var img = images.legSegment2.img;
    ctx.save();
    ctx.translate(-img.width / 2, 0);
    ctx.drawImage(img, 0, 0);
    ctx.restore();

	ctx.translate(0, img.height - scrunch - OPTIONS.LEG_COMBINE_JOINTS);
    scrunch += Math.sin(g_clock + legNdx + 2);
	ctx.rotate((scrunch * -10) * Math.PI / 180);

    var img = images.legTip.img;
    ctx.translate(-img.width / 2, 0);
    ctx.drawImage(img, 0, 0);
	ctx.restore();
    return;
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
	ctx.rotate(rotation);
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

InkSystem = (function(){
  "strict";
  var inks = [];
  var inkTime = 0;
  var inkXOff = 0;
  var inkYOff = 0;
  var inkCount = 0;

  function drawInks(ctx, elapsedTime) {
    var ii;
    for (ii = 0; ii < inks.length; ++ii) {
      var ink = inks[ii];
      if (g_clock < ink.time) {
        break;
      }
    }
    inks.splice(0, ii);

    if (inkTime < g_clock && inkCount > 0) {
      inkTime = g_clock + OPTIONS.INK_LEAK_DURATION / OPTIONS.INK_COUNT;
      --inkCount;
      var octoInfo = OctopusControl.getInfo();
      birthInk(octoInfo.x + inkXOff, octoInfo.y + inkYOff);
    }

    var alpha = ctx.globalAlpha;
    for (var ii = 0; ii < inks.length; ++ii) {
      var ink = inks[ii];
      var img = ink.img;
      ink.rot += ink.rotVel * elapsedTime;
      var lerp1to0 = (ink.time - g_clock) / OPTIONS.INK_DURATION;
      var scale = 0.5 + (1 - lerp1to0) * OPTIONS.INK_SCALE;
      ctx.save();
      ctx.translate(ink.x, ink.y);
	  ctx.rotate(ink.rot);
      ctx.scale(scale, scale);
      ctx.translate(img.width / -2, img.height / -2);
      ctx.globalAlpha = lerp1to0;
	  ctx.drawImage(img, 0, 0);
      ctx.restore();
    }
    canvas.globalAlpha = alpha;
  }

  var inkImages = [
    "ink01",
    "ink02"
  ];

  function birthInk(x, y) {
    var ink = {
      x: x,
      y: y,
      img: images[inkImages[randInt(inkImages.length)]].img,
      rot: Math.random() * Math.PI * 2,
      rotVel: (Math.random() - 0.5) * Math.PI,
      time: g_clock + OPTIONS.INK_DURATION
    };
    inks.push(ink);
  }

  function startInk(x, y) {
    inkXOff = x;
    inkYOff = y;
    inkCount = OPTIONS.INK_COUNT;
  }

  return {
    birthInk: birthInk,
    drawInks: drawInks,
    startInk: startInk,

    dummy: undefined
  }
}());

