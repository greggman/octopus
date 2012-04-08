/*
 * Copyright 2012, Co-Octopi.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Co-Octopi. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
window.onload = main;

var HasLost = false;
var DistanceTraveled = 0;
var PrevPos = {x: 0, y: 0};
var health = 9;
var g_canvas;
var g_ctx;
var g_clock = 0;
var g_bgm;
var g_octopi = [];
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
var g_oldCollision = false;
var g_printMsgs = [];
var g_gameState = 'title';
var OPTIONS = {
	numOctopi: 2,
  LEG_SCRUNCH: 5,
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

MergeOptions(OPTIONS, OctoRender.getOptions());
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
    g_canvas.height = g_canvas.clientHeight;
  }
}

var g_images = {
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
  window.addEventListener('blur', function() {
		if (!OPTIONS.noPause) {
			pauseGame();
		}
	}, true);
  window.addEventListener('focus', function() {
		if (!OPTIONS.noPause) {
			resumeGame();
		}
	}, true);
  g_ctx = g_canvas.getContext("2d");

	var loader = new Loader(function() {
		processImages(mainLoop);
	});
  loader.loadImages(g_images);
  if (OPTIONS.battle) {
		for (var ii = 0; ii < OPTIONS.numOctopi; ++ii) {
			g_octopi.push(new OctopusControl(ii));
		}
  } else {
		g_octopi.push(new OctopusControl(0));
	}

  if (true) {
   g_bgm = $('bgm');
   g_bgm.addEventListener('ended', function() {
       log("replay");
       this.currentTime = 0;
       this.play();
   }, false);
  }
  audio.init(Sounds);

  for (var ii = 0; ii < g_octopi.length; ++ii) {
    var octopus = g_octopi[ii];
		var images = OctoRender.getImages();
    octopus.legMovement = [0, 0, 0, 0, 0, 0, 0, 0];
    octopus.legBackSwing = [false, false, false, false, false, false, false, false];
    octopus.expression =
    {
    	img: images.bodyNormal,
    	timer: 0
    };
    octopus.setLegs(OctoRender.getLegsInfo());
		var r = 150;
		var a = Math.PI * 2 * ii / g_octopi.length;
		var x = g_canvas.width / 2 + Math.sin(a) * r;
		var y = g_canvas.width / 2 + Math.cos(a) * r;
    octopus.setInfo(x, y, 0);
		octopus.drawInfo = {
			hue: chooseHue(ii),
			images: images,
			legsInfo: octopus.getLegsInfo(),
			legMovement: octopus.legMovement,
			expression: octopus.expression,
			//make legs drift if the octopus is dead
			legDrift: .5,
			deathAnimDistance: 0
		};
		loader.loadImages(images);
  }

  MakeLevel();

	function chooseHue(ii) {
		var hue = (1 - ii * 0.2) % 1;
		if (ii % 10 >= 5) {
			hue += 0.1;
		}
		if (ii % 20 >= 10) {
			hue += 0.05;
		}
		return hue;
	}

  var then = getTime();
  function mainLoop() {
    var now = getTime();
    var elapsedTime = Math.min(0.1, now - then);
    then = now;
    g_clock += elapsedTime;

    update(elapsedTime, g_ctx);
    drawPrint(g_ctx);

    requestId = requestAnimFrame(mainLoop, g_canvas);
  }

  function resize() {
    resizeCanvas();
    update(0.0001, g_ctx);
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

	function processImages(callback) {
		var count = 0;
		for (var ii = 0; ii < g_octopi.length; ++ii) {
			var octopus = g_octopi[ii];
			var drawInfo = octopus.drawInfo;
			if (drawInfo.hue) {
				var octoImages = drawInfo.images;
				for (var name in octoImages) {
					++count;
					var image = octoImages[name].img;
					ImageProcess.adjustHSV(image, drawInfo.hue, 0, 0, function(images, name) {
						return function(img) {
							images[name].img = img;
							--count;
							checkDone();
						}
					}(octoImages, name));
				}
			}
		}

		function checkDone() {
			if (count == 0) {
				callback();
			}
		}

		checkDone();
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
		MakeCollectible(pseudoRandInt(g_canvas.width), y + 33, g_images.collectible.img.width * .5);//
	}
  }
}

function CheckCollisions() {
  g_oldCollision = g_inCollision;
  g_inCollision = false;
  for (var jj = 0; jj < g_octopi.length; ++jj) {
    var octopus = g_octopi[jj];
    var octoInfo = octopus.getInfo();
    for (var ii = 0; ii < g_obstacles.length; ++ii) {
      var obj = g_obstacles[ii];
      var dx = obj.x - octoInfo.x;
      var dy = obj.y - octoInfo.y;
      //ctx.font = "12pt monospace";
      //ctx.fillStyle = "white";
      //ctx.fillText("dx: " + dx + " dy: " + dy, 10, 20);
      var rad = obj.type.radius * obj.type.scale + OPTIONS.OCTOPUS_RADIUS;
      var radSq = rad * rad;
      var distSq = dx * dx + dy * dy;
      //ctx.fillText("dsq: " + distSq + " rSq: " + radSq, 10, 40);
      if (distSq < radSq && g_gameState == "play") {
        g_inCollision = true;
        if (!g_oldCollision) {
          octopus.shootBack(obj);
          InkSystem.startInk(dx / 2, dy / 2);
          audio.play_sound('ouch');
          audio.play_sound('urchin');
          health = health - 3;//take damage
          //change expression
          octopus.expression.img = octopus.drawInfo.images.bodyOw;
          octopus.expression.timer = 35;
        }
        break;
      }
    }
  }
}

function CheckCollection()
{
    for (var jj = 0; jj < g_octopi.length; ++jj) {
        var octopus = g_octopi[jj];
    	var octoInfo = octopus.getInfo();
    	var itemsToRemove = [];
    	for (var ii = 0; ii < g_collectibles.length; ii++)
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
    			octopus.expression.img = octopus.drawInfo.images.bodyHappy;
    			octopus.expression.timer = 35;
    		}
    	}
    	//remove collected items
    	for (var ii = 0; ii < itemsToRemove; ii++)
    	{
    		g_collectibles.splice(itemsToRemove[ii], 1);
    	}
    }
}

var g_bgPattern;
function drawBackground(ctx) {
	if (!g_bgPattern) {
		g_bgPattern = ctx.createPattern(g_images.background.img, "repeat");
	}
	ctx.save();
	ctx.translate(-g_scrollIntX, -g_scrollIntY);
	ctx.fillStyle = g_bgPattern;
	ctx.fillRect(g_scrollIntX, g_scrollIntY, ctx.canvas.width / g_baseScale, ctx.canvas.height / g_baseScale / g_heightScale);
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
	for (var ii = 0; ii < 3; ii++)
	{
		if(hpCounter >= 3)
		{
			ctx.drawImage(g_images.health3.img, 0, 0);
			hpCounter = hpCounter - 3;
		}
		else if(hpCounter >= 2)
		{
			ctx.drawImage(g_images.health2.img, 0, 0);
			hpCounter = hpCounter - 2;
		}
		else if(hpCounter >= 1)
		{
			ctx.drawImage(g_images.health1.img, 0, 0);
			hpCounter = hpCounter - 1;
		}
		else
		{
			ctx.drawImage(g_images.health0.img, 0, 0);
		}
		ctx.translate(g_images.health1.img.width, 0);
	}
	ctx.restore();
}

function drawObstacles(ctx) {
  for (var ii = 0; ii < g_obstacles.length; ++ii) {
    var obj = g_obstacles[ii];
    var img = g_images[obj.type.name].img;
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
	for (var i = 0; i < g_collectibles.length; i++)
	{
		var obj = g_collectibles[i];
		if(!obj.isCollected)
		{
			ctx.save();
			var img = g_images.collectible.img;
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

g_debounceTimer = 0;

function update(elapsedTime, ctx) {
	print("");
	//allow play again if the octopus is dead
	window.addEventListener('click', handleClick);
    window.addEventListener('touchstart', handleClick);

    function handleClick(event)
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
	}

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
    for (var jj = 0; jj < g_octopi.length; ++jj) {
      g_octopi[jj].update(elapsedTime);
    }
  }
  var octoInfo = g_octopi[0].getInfo();
  
  //track score
  DistanceTraveled += ((octoInfo.y - PrevPos.y) / 10) | 0;
  PrevPos.x = octoInfo.x;
  PrevPos.y = octoInfo.y;

  ctx.save();

  if (OPTIONS.battle) {
    var octoInfo = g_octopi[0].getInfo();
		var minX = octoInfo.x;
		var minY = octoInfo.y;
		var maxX = octoInfo.x;
		var maxY = octoInfo.y;
		for (var ii = 1; ii < g_octopi.length; ++ii) {
			var octoInfo = g_octopi[ii].getInfo();
			minX = Math.min(octoInfo.x, minX);
			minY = Math.min(octoInfo.y, minY);
			maxX = Math.max(octoInfo.x, maxX);
			maxY = Math.max(octoInfo.y, maxY);
		}
		var dx = maxX - minX;
		var dy = maxY - minY;
		var centerX = minX + dx * 0.5;
		var centerY = minY + dy * 0.5;

    g_heightScale = g_canvas.clientWidth / g_canvas.width;
    var screenWidth = 1024
    var screenHeight = g_canvas.height / g_heightScale;

    print("sw: " + screenWidth + " sh:" + screenHeight.toFixed(0));
    print("adx: " + dx.toFixed(0) + " ady: " + dy.toFixed(0));

    var halfScreenWidth = screenWidth / 2;
    var halfScreenHeight = screenHeight / 2;

    g_baseScale = 1;
    if (dx > halfScreenWidth) {
      g_baseScale = halfScreenWidth / dx;
    }
    if (dy > halfScreenHeight) {
      var yBaseScale = halfScreenHeight / dy;
      g_baseScale = Math.min(g_baseScale, yBaseScale);
    }

    print("bs: " + g_baseScale.toFixed(3));

    var targetX = centerX - g_canvas.width / g_baseScale / 2;
    var targetY = centerY - g_canvas.height / g_baseScale / g_heightScale / 2;

    g_scrollX += (targetX - g_scrollX) * OPTIONS.CAMERA_CHASE_SPEED;
    g_scrollY += (targetY - g_scrollY) * OPTIONS.CAMERA_CHASE_SPEED;

    ctx.scale(g_baseScale, g_baseScale * g_heightScale);
  } else {
    var targetX = octoInfo.x - g_canvas.width / 2 - g_canvas.width / 4 * Math.sin(octoInfo.rotation);
    var targetY = octoInfo.y - g_canvas.height / 2 + g_canvas.height / 4 * Math.cos(octoInfo.rotation);

    //g_scrollX += (targetX - g_scrollX) * OPTIONS.CAMERA_CHASE_SPEED;
    g_scrollY += (targetY - g_scrollY) * OPTIONS.CAMERA_CHASE_SPEED;

    g_heightScale = g_canvas.clientWidth / g_canvas.width;
    ctx.scale(1, g_heightScale);
  }


  g_scrollIntX = Math.floor(g_scrollX);
  g_scrollIntY = Math.floor(g_scrollY);
  drawBackground(ctx);

  if (g_gameState == "play" || g_gameState == "gameover") {
		ctx.save();
		ctx.translate(-g_scrollIntX, -g_scrollIntY);

		drawObstacles(ctx);
		drawCollectibles(ctx);

		for (var jj = 0; jj < g_octopi.length; ++jj) {
			var octopus = g_octopi[jj];
			var octoInfo = octopus.getInfo();
			var legMovement = octopus.legMovement;
			var legBackSwing = octopus.legBackSwing;
			var expression = octopus.expression;
			var drawInfo = octopus.drawInfo;
			ctx.save();
			ctx.translate(0, octoInfo.y);
			ctx.translate(octoInfo.x, 0);
			ctx.rotate(octoInfo.rotation);

			drawInfo.hasLost = HasLost;
			drawInfo.clock = g_clock + jj;
			// only follow the octopus if you haven't yet lost
			if(HasLost)
			{
				drawInfo.x = 0;
				drawInfo.y = -drawInfo.deathAnimDistance;
				drawInfo.rotation = 0;
				//make the octopus fly up
				OctoRender.drawOctopus(ctx, drawInfo);
				if(drawInfo.deathAnimDistance < 500)
				{
					drawInfo.deathAnimDistance = drawInfo.deathAnimDistance + 4;
				}
				expression.timer = 100;
				ctx.restore();
			}
			else
			{
				drawInfo.x = 0;
				drawInfo.y = 0;
				drawInfo.rotation = 0;
				OctoRender.drawOctopus(ctx, drawInfo);
			}
			//change expression
			if(expression.timer > 0)
			{
			expression.timer--;
			}
			else
			{
			expression.timer = 0;
			expression.img = drawInfo.images.bodyNormal;
			}
			var legsInfo = octopus.getLegsInfo();
			for (var ii = 0; ii < legsInfo.length; ++ii) {
				var legInfo = legsInfo[ii];
				//start leg animation
				if(legInfo.upTime > g_clock) {
					legMovement[ii] = Math.min(OPTIONS.LEG_SCRUNCH, legMovement[ii] + OPTIONS.LEG_SCRUNCH_SPEED * elapsedTime);
				} else {
					legMovement[ii] = Math.max(0, legMovement[ii] - OPTIONS.LEG_UNSCRUNCH_SPEED * elapsedTime);
				}
			}
			//increment leg animation
			if (OPTIONS.debug) {
				drawCircleLine(ctx, 0, 0, OPTIONS.OCTOPUS_RADIUS, g_inCollision ? "red" : "white");
			}
			ctx.restore();
		}

		InkSystem.drawInks(ctx, elapsedTime);

		if (OPTIONS.battle && OPTIONS.debug) {
			ctx.strokeStyle = "white";
			ctx.strokeRect(minX, minY, dx, dy);
			drawCircle(ctx, centerX, centerY, 5, "white");
		}

		ctx.restore(); // scroll

  } // endif g_gamestate

  if (g_gameState == "play" || g_gameState == "gameover") {
	drawHealthHUD(20, 20, ctx);//hud should follow octo translate but not rotation
  }
  if(HasLost)
  {
	//display ending splash screen
	drawImageCentered(ctx, g_images.outOfInk.img, g_canvas.width / 2, g_canvas.height / 5);
	drawImageCentered(ctx, g_images.playAgain.img, g_canvas.width / 2, g_canvas.height / 5 + 150);
	ctx.font = "20pt monospace";
    ctx.fillStyle = "white";
	ctx.fillText("You crawled "+DistanceTraveled+" tentacles before exploding!",
		g_canvas.width / 4.6, g_canvas.height / 3 + 100);
  }

  switch (g_gameState) {
  case 'title':
	var h = g_canvas.height * 0.5 - (g_images.title.img.height + g_images.play.img.height) * 0.5;
	h /= g_heightScale;
	var h = g_canvas.height * 0.5 / g_heightScale;
	print("")
	print("gs:" + g_heightScale);
	print("h:" + h);
	drawImageCentered(ctx, g_images.title.img, g_canvas.width / 2, g_canvas.height / 4);
    drawImageCentered(ctx, g_images.play.img, g_canvas.width / 2, g_canvas.height / 4 + 250);
	break;
  case 'tutorial':
	drawImageCentered(ctx, g_images.tutorial.img, g_canvas.width / 2, g_canvas.height / 3);
	break;
  }

  ctx.restore(); // for screen scale

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
      var octoInfo = g_octopi[0].getInfo();
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
    g_canvas.globalAlpha = alpha;
  }

  var inkImages = [
    "ink01",
    "ink02"
  ];

  function birthInk(x, y) {
    var ink = {
      x: x,
      y: y,
      img: g_images[inkImages[randInt(inkImages.length)]].img,
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

