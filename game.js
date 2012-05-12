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

var g_battleObstacles = [
{ type: 0, x: 100, y: 100},
{ type: 1, x: 550, y: 100},
{ type: 0, x: 1000, y: 100},
{ type: 1, x: 1450, y: 100},
{ type: 1, x: 100, y: 550},
{ type: 0, x: 550, y: 550},
{ type: 1, x: 1000, y: 550},
{ type: 0, x: 1450, y: 550},
];

var g_battleCollectables = [
{ scale: 0.5, x: 150, y: 100},
{ scale: 0.7, x: 350, y: 100},
{ scale: 0.5, x: 550, y: 100},
{ scale: 0.7, x: 150, y: 400},
{ scale: 0.5, x: 350, y: 400},
{ scale: 0.7, x: 550, y: 400},
];

var g_battleSpawnPoints = [
{ x: 1900, y: 1000, },
{ x: 1200, y: 1200, },
{ x: 1900, y: 1100, },
{ x: 1200, y: 1400, },
];

var g_selected = -1;
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
var g_nextSpawnPoint = 0;
var g_baseScale = 1;
var g_obstacles = [];
var g_collectedItems = [];
var g_collectibles = [];
var g_printMsgs = [];
var g_gameState = 'title';
var OPTIONS = {
	showAll: false,      // show inactive octopi
	noPause: false,      // don't pause the game when out of focus
	debug: false,        // show extra info
	battle: false,       // start battle mode
	noObstacles: false,  // turn off obstacles
	numOctopi: 2,
	bumpVel: 5,
	healthBumpMult: 0.3,
	deathAnimLimit: 300,
	deathAnimFadeLimit: 150,
	deathAnimSpeed: 100,
	respawnTime: 3,
	legScrunch: 5,
	legScrunchSpeed: 90,
	legUnscrunchSpeed: 20,
	levelWidth: 1024,
	levelHeight: 768,
	battleLevelWidth: 1024 * 3,
	battleLevelHeight: 768 * 3,
	sideLimit: 100,
	bottomLimit: 100,
	cameraChaseSpeed: 0.2,
	octopusRadius: 85,
	inkDuration: 1,
	inkLeakDuration: 1.5,
	inkCount: 10,
	inkScale: 0.3,
	legFriction: 0.98,
	legRotFriction: 0.98,
	legAcceleration: 60,
	legUpDuration: 0.8,
	shootBackVelocity: -120,
	urchinScale1: .5,
	urchinScale2: .8,
	collectibleScale: .5,
	collectibleRadius: 40,
	urchinSpawnRate: .24,
	collectibleRespawnTime: 10,
};

MergeOptions(OPTIONS, OctoRender.getOptions());
getURLOptions(OPTIONS);

function print(msg)
{
	if (OPTIONS.debug)
	{
		g_printMsgs.push(msg);
	}
}

function drawPrint(ctx)
{
	ctx.font = "10pt monospace";
	ctx.fillStyle = "white";
	for (var ii = 0; ii < g_printMsgs.length; ++ii)
	{
		ctx.fillText(g_printMsgs[ii], 10, ii * 15 + 20);
	}
	g_printMsgs = [];
}

function drawText(ctx, x, y, msg, opt_color) {
	ctx.font = "10pt monospace";
	ctx.fillStyle = opt_color || "white";
	ctx.fillText(msg, x, y);
}

// return int from 0 to range - 1
function randInt(range)
{
	return Math.floor(Math.random() * range);
}

function resizeCanvas()
{
	if (g_canvas.height != g_canvas.clientHeight)
	{
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
		url: "images/inkbottle_full.png"
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
	{name:"urchin01", radius: 125, scale: OPTIONS.urchinScale1},//150 original
	{name:"urchin02", radius: 125, scale: OPTIONS.urchinScale2}//scale should be .4 and .8
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

function main()
{
	connect();
	var requestId;
	g_canvas = document.getElementById("canvas");
	resizeCanvas();
	window.addEventListener('resize', resize, true);
	window.addEventListener('blur', function(){
		if (!OPTIONS.noPause){
			pauseGame();
		}
	}, true);
	window.addEventListener('focus', function(){
		if (!OPTIONS.noPause){
			resumeGame();
		}
	}, true);
	g_ctx = g_canvas.getContext("2d");

	var loader = new Loader(function(){
		processImages(mainLoop);
	});
	loader.loadImages(g_images);
	if (OPTIONS.battle)
	{
		g_gameState = 'play';
		InputSystem.startInput();
		for (var ii = 0; ii < OPTIONS.numOctopi; ++ii)
		{
			var octopus = new OctopusControl(ii);
			addNetOctopus(octopus);
			g_octopi.push(octopus);
		}
	}
	else
	{
		g_octopi.push(new OctopusControl(0));
		addNetOctopus(g_octopi[0]);
	}

	g_bgm = document.getElementById('bgm');
	if (OPTIONS.noBGM)
	{
	  g_bgm.pause();
	}
	audio.init(Sounds);

	for (var ii = 0; ii < g_octopi.length; ++ii)
	{
		var octopus = g_octopi[ii];
		var images = OctoRender.getImages();
		octopus.health = 9;
		octopus.hasLost = false;
		octopus.inactive = OPTIONS.battle || OPTIONS.showAll;
		octopus.respawnTimer = 0;
		octopus.distanceTraveled = 0;
		octopus.legMovement = [0, 0, 0, 0, 0, 0, 0, 0];
		octopus.legBackSwing = [false, false, false, false, false, false, false, false];
		octopus.prevPos = {x: 0, y: 0};
		octopus.expression =
		{
			img: images.bodyNormal,
			timer: 0
		};
		octopus.setLegs(OctoRender.getLegsInfo());
		if (OPTIONS.battle) {
			var sp = g_battleSpawnPoints[ii % g_battleSpawnPoints.length];
			octopus.setInfo(sp.x, sp.y, 0);
		} else {
			var r = 450;
			var a = Math.PI * 2 * ii / g_octopi.length;
			var x = g_canvas.width / 2 + Math.sin(a) * r;
			var y = g_canvas.height / 2 + Math.cos(a) * r;
			octopus.setInfo(x, y - r / 2, 0);
		}
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

	function chooseHue(ii)
	{
		var hue = (1 - ii * 0.2) % 1;
		if (ii % 10 >= 5)
		{
			hue += 0.1;
		}
		if (ii % 20 >= 10)
		{
			hue += 0.05;
		}
		return hue;
	}

	//allow play again if the octopus is dead
	window.addEventListener('click', handleClick);
	window.addEventListener('touchstart', handleClick);

	function handleClick(event)
	{
		if (g_clock < g_debounceTimer)
		{
			return;
		}

		g_debounceTimer = g_clock + 0.5;
		switch (g_gameState)
		{
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

	var then = getTime();
	function mainLoop()
	{
		var now = getTime();
		var elapsedTime = Math.min(0.1, now - then);
		then = now;
		g_clock += elapsedTime;

		update(elapsedTime, g_ctx);
		drawPrint(g_ctx);

		requestId = requestAnimFrame(mainLoop, g_canvas);
	}

	function resize()
	{
		resizeCanvas();
		update(0.0001, g_ctx);
	}

	function pauseGame()
	{
		if (requestId !== undefined)
		{
			cancelRequestAnimFrame(requestId);
			requestId = undefined;
		}
	}

	function resumeGame()
	{
		if (requestId === undefined)
		{
			mainLoop();
		}
	}

	function processImages(callback)
	{
		var count = 0;
		for (var ii = 0; ii < g_octopi.length; ++ii)
		{
			var octopus = g_octopi[ii];
			var drawInfo = octopus.drawInfo;
			if (drawInfo.hue)
			{
				var octoImages = drawInfo.images;
				for (var name in octoImages)
				{
					++count;
					var image = octoImages[name].img;
					ImageProcess.adjustHSV(image, drawInfo.hue, 0, 0, function(images, name){
						return function(img){
							images[name].img = img;
							--count;
							checkDone();
						}
					}(octoImages, name));
				}
			}
		}

		function checkDone()
		{
			if (count == 0)
			{
				callback();
			}
		}

		checkDone();
	}
}

function MakeObstacle(type, x, y)
{
	if (OPTIONS.noObstacles) {
		return;
	}

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
			radius: radius * OPTIONS.collectibleScale
		},
		radius: radius,
		isCollected: false
	};
	g_collectibles.push(obj);
}

function MakeLevel()
{
	if (OPTIONS.battle) {
		var obstacles = g_battleObstacles;
		for (var ii = 0; ii < obstacles.length; ++ii) {
			var o = obstacles[ii]
			MakeObstacle(Obstacles[o.type], o.x, o.y);
		}
		var collectables = g_battleCollectables;
		for (var ii = 0; ii < collectables.length; ++ii) {
			var o = collectables[ii]
			MakeCollectible(o.x, o.y, o.scale);
		}
	} else {
		var y = g_canvas.height;
		var width = g_canvas.width * 0.8;
		var xOff = Math.floor((g_canvas.width - width) * 0.5);
		for (var ii = 0; ii < 100; ++ii)
		{
			//make obstacle
			var x = xOff + pseudoRandInt(g_canvas.width);
			MakeObstacle(Obstacles[pseudoRandInt(Obstacles.length)], x, y);
			OPTIONS.urchinSpawnRate -= .001;
			y += g_canvas.height * OPTIONS.urchinSpawnRate;
			//make collectible
			if (ii % 2 == 0)
			{
				MakeCollectible(pseudoRandInt(g_canvas.width), y + 33, g_images.collectible.img.width * .5);//
			}
		}
	}
}

function CheckOctopusCollisions() {
	var radSq = Math.pow(OPTIONS.octopusRadius * 2, 2);
	for (var ii = 0; ii < g_octopi.length; ++ii)
	{
		var octo = g_octopi[ii];
		octo.oldTouching = octo.touching;
		octo.touching = false;
	}
	for (var ii = 0; ii < g_octopi.length; ++ii)
	{
		var octo1 = g_octopi[ii];
		if (octo.hasLost || octo.inactive)
		{
			continue;
		}
		var info1 = octo1.getInfo();
		for (var jj = ii + 1; jj < g_octopi.length; ++jj)
		{
			var octo2 = g_octopi[jj];
			if (octo2.hasLost || octo.inactive)
			{
				continue;
			}
			var info2 = octo2.getInfo();
			var dx = info1.x - info2.x;
			var dy = info1.y - info2.y;
			var distSq = dx * dx + dy * dy;
			if (distSq < radSq)
			{
				octo1.touching = true;
				octo2.touching = true;
				var l = Math.max(Math.sqrt(distSq), 0.0001);
				var nx = dx / l * Math.max(OPTIONS.bumpVel, l * 0.5);
				var ny = dy / l * Math.max(OPTIONS.bumpVel, l * 0.5)
				var o1Boost = (1 + Math.max(0, octo2.health) * OPTIONS.healthBumpMult);
				var o2Boost = (1 + Math.max(0, octo1.health) * OPTIONS.healthBumpMult);
				octo1.addVel( nx * o1Boost,  ny * o1Boost);
				octo2.addVel(-nx * o2Boost, -ny * o2Boost);
			}
		}
	}
}

function CheckCollisions()
{
	for (var jj = 0; jj < g_octopi.length; ++jj)
	{
		var octopus = g_octopi[jj];
		var octoInfo = octopus.getInfo();
		octopus.oldCollision = octopus.inCollision;
		octopus.inCollision = false;

		if (octopus.hasLost || octopus.inactive) {
			continue;
		}

		for (var ii = 0; ii < g_obstacles.length; ++ii)
		{
			var obj = g_obstacles[ii];
			var dx = obj.x - octoInfo.x;
			var dy = obj.y - octoInfo.y;
			//ctx.font = "12pt monospace";
			//ctx.fillStyle = "white";
			//ctx.fillText("dx: " + dx + " dy: " + dy, 10, 20);
			var rad = obj.type.radius * obj.type.scale + OPTIONS.octopusRadius;
			var radSq = rad * rad;
			var distSq = dx * dx + dy * dy;
			//ctx.fillText("dsq: " + distSq + " rSq: " + radSq, 10, 40);
			if (distSq < radSq && g_gameState == "play")
			{
				octopus.inCollision = true;
				if (!octopus.oldCollision)
				{
					octopus.shootBack(obj);
					InkSystem.startInk(jj, dx / 2, dy / 2);
					audio.play_sound('ouch');
					audio.play_sound('urchin');
					octopus.health -= 3;//take damage
					//change expression
					octopus.expression.img = octopus.drawInfo.images.bodyOw;
					octopus.expression.timer = 35;
				}
				break;
			}
		}
	}
}

function CheckCollection(curTime)
{
	for (var jj = 0; jj < g_octopi.length; ++jj)
	{
		var octopus = g_octopi[jj];
		var octoInfo = octopus.getInfo();

		if (octopus.hasLost || octopus.inactive) {
			continue;
		}

		var itemsToRemove = [];
		for (var ii = 0; ii < g_collectibles.length; ii++)
		{
			var obj = g_collectibles[ii];

			if (!obj.isCollected) {
				var dx = obj.x - octoInfo.x;
				var dy = obj.y - octoInfo.y;
				var rad = OPTIONS.collectibleRadius * obj.radius + OPTIONS.octopusRadius;
				var radSq = rad * rad;
				var distSq = dx * dx + dy * dy;

				if (distSq < radSq)
				{
					audio.play_sound('eat');
					//collect stuffs!
					obj.timeCollected = curTime;
					obj.isCollected = true;
					//get healed a little
					octopus.health = Math.min(octopus.health + 1, 9);
					//change expression
					octopus.expression.img = octopus.drawInfo.images.bodyHappy;
					octopus.expression.timer = 35;
				}
			}
		}
	}

	for (var ii = 0; ii < g_collectibles.length; ii++)
	{
		var obj = g_collectibles[ii];
		if (obj.isCollected) {
			var timeElapsed = curTime - obj.timeCollected;
			print("" + ii + ": " + timeElapsed.toFixed(3));
			if (timeElapsed > OPTIONS.collectibleRespawnTime) {
				obj.isCollected = false;
			}
		}
	}
}

var g_bgPattern;
function drawBackground(ctx)
{
	if (!g_bgPattern)
	{
		g_bgPattern = ctx.createPattern(g_images.background.img, "repeat");
	}
	ctx.save();
	ctx.translate(-g_scrollIntX, -g_scrollIntY);
	ctx.fillStyle = g_bgPattern;
	ctx.fillRect(g_scrollIntX, g_scrollIntY, ctx.canvas.width / g_baseScale, ctx.canvas.height / g_baseScale / g_heightScale);
	ctx.restore();
}

function drawImageCentered(ctx, img, x, y)
{
	ctx.save();
	ctx.translate(x, y);
	ctx.translate(-img.width * 0.5, -img.height * 0.5);
	//ctx.fillStyle = "purple";
	//ctx.fillRect(0, 0, img.width, img.height);
	ctx.drawImage(img, 0, 0);
	ctx.restore();
}

function drawHealthHUD(ctx, octopus, x, y)
{
	var hpCounter = octopus.health;
	ctx.save();
	ctx.translate(x, y);
	for (var ii = 0; ii < 3; ii++)
	{
		if (hpCounter >= 3)
		{
			ctx.drawImage(g_images.health3.img, 0, 0);
			hpCounter = hpCounter - 3;
		}
		else if (hpCounter >= 2)
		{
			ctx.drawImage(g_images.health2.img, 0, 0);
			hpCounter = hpCounter - 2;
		}
		else if (hpCounter >= 1)
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

function drawObstacles(ctx)
{
	for (var ii = 0; ii < g_obstacles.length; ++ii)
	{
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
		if (OPTIONS.debug)
		{
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
		if (!obj.isCollected)
		{
			ctx.save();
			var img = g_images.collectible.img;
			var scale = obj.radius;
			ctx.translate(obj.x, obj.y);
			ctx.scale(scale, scale);
			ctx.save()
			ctx.translate(-Math.floor(img.width / 2), -Math.floor(img.height / 2));
			ctx.drawImage(img, 0, 0);
			ctx.restore();
			if (OPTIONS.debug)
			{
				drawCircleLine(ctx, 0, 0, OPTIONS.collectibleRadius, "white");
			}
			ctx.restore();
		}
	}

}

g_debounceTimer = 0;

function update(elapsedTime, ctx)
{
	print("");

	//check losing state
	if (!OPTIONS.battle)
	{
		if (g_octopi[0].health <= 0)
		{
			InputSystem.stopInput();
			g_octopi[0].hasLost = true;
			g_gameState = 'gameover';
		}
	}

	CheckCollisions();
	CheckCollection(g_clock);
	CheckOctopusCollisions();

	for (var jj = 0; jj < g_octopi.length; ++jj)
	{
		var octopus = g_octopi[jj];
		if (!octopus.hasLost && !octopus.inactive)
		{
			octopus.update(elapsedTime);
			//track score
			var octoInfo = octopus.getInfo();
			octopus.distanceTraveled += -1 * Math.floor(octopus.prevPos.y - octoInfo.y);
			octopus.prevPos.x = octoInfo.x;
			octopus.prevPos.y = octoInfo.y;
		}
	}


	ctx.save();

	if (OPTIONS.battle)
	{
		var octoInfo = g_octopi[0].getInfo();
		var minX = octoInfo.x;
		var minY = octoInfo.y;
		var maxX = octoInfo.x;
		var maxY = octoInfo.y;
		for (var ii = 1; ii < g_octopi.length; ++ii)
		{
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

		if (OPTIONS.debug) {
			print("sw: " + screenWidth + " sh:" + screenHeight.toFixed(0));
			print("adx: " + dx.toFixed(0) + " ady: " + dy.toFixed(0));
			print("active: " + g_numActiveOctopi);
			for (var ii = 0; ii < g_octopiByNumPlayers.length; ++ii) {
				var octopi = g_octopiByNumPlayers[ii];
				print ("" + ii + ": " + octopi.length);
			}
		}

		var halfScreenWidth = screenWidth / 2;
		var halfScreenHeight = screenHeight / 2;

		g_baseScale = 1;
		if (dx > halfScreenWidth)
		{
			g_baseScale = halfScreenWidth / dx;
		}
		if (dy > halfScreenHeight)
		{
			var yBaseScale = halfScreenHeight / dy;
			g_baseScale = Math.min(g_baseScale, yBaseScale);
		}

		g_baseScale = Math.max(0.33, g_baseScale);
		g_baseScale = 0.33;

		print("bs: " + g_baseScale.toFixed(3));

		var targetX = centerX - g_canvas.width / g_baseScale / 2;
		var targetY = centerY - g_canvas.height / g_baseScale / g_heightScale / 2;

		g_scrollX += (targetX - g_scrollX) * OPTIONS.cameraChaseSpeed;
		g_scrollY += (targetY - g_scrollY) * OPTIONS.cameraChaseSpeed;

		g_scrollX = Math.max(0, g_scrollX);
		g_scrollY = Math.max(0, g_scrollY);

		print("scroll:" + Math.floor(g_scrollX) + "," + Math.floor(g_scrollY));

		ctx.scale(g_baseScale, g_baseScale * g_heightScale);
	}
	else
	{
		var octoInfo = g_octopi[0].getInfo();
		var targetX = octoInfo.x - g_canvas.width / 2 - g_canvas.width / 4 * Math.sin(octoInfo.rotation);
		var targetY = octoInfo.y - g_canvas.height / 2 + g_canvas.height / 4 * Math.cos(octoInfo.rotation);

		//g_scrollX += (targetX - g_scrollX) * OPTIONS.cameraChaseSpeed;
		g_scrollY += (targetY - g_scrollY) * OPTIONS.cameraChaseSpeed;

		g_heightScale = g_canvas.clientWidth / g_canvas.width;
		ctx.scale(1, g_heightScale);
	}


	g_scrollIntX = Math.floor(g_scrollX);
	g_scrollIntY = Math.floor(g_scrollY);
	drawBackground(ctx);

	if (g_gameState == "play" || g_gameState == "gameover")
	{
		ctx.save();
		ctx.translate(-g_scrollIntX, -g_scrollIntY);

		drawObstacles(ctx);
		drawCollectibles(ctx);

		for (var jj = 0; jj < g_octopi.length; ++jj)
		{
			var octopus = g_octopi[jj];
			var octoInfo = octopus.getInfo();
			var legMovement = octopus.legMovement;
			var legBackSwing = octopus.legBackSwing;
			var expression = octopus.expression;
			var drawInfo = octopus.drawInfo;

			if (octopus.respawnTimer > 0)
			{
				octopus.respawnTimer -= elapsedTime;
				if (octopus.respawnTimer > 0)
				{
					continue;
				}
				redistributePlayers(octopus.netInfo);
				octopus.hasLost = false;
				octopus.health = 9;
				var sp = g_battleSpawnPoints[(g_nextSpawnPoint++) % g_battleSpawnPoints.length];
				octopus.setInfo(sp.x, sp.y, 0);
				drawInfo.deathAnimDistance = 0;
				drawInfo.legDrift = 0.5;
				octopus.distanceTraveled = 0;
				expression.timer = 0;
				expression.img = drawInfo.images.bodyNormal;
			}

			if (octopus.inactive) {
				continue;
			}


			if (octopus.health <= 0)
			{
				octopus.hasLost = true;
			}

			ctx.save();
			ctx.translate(0, octoInfo.y);
			ctx.translate(octoInfo.x, 0);
			ctx.rotate(octoInfo.rotation);

			drawInfo.hasLost = octopus.hasLost;
			drawInfo.clock = g_clock + jj;
			drawInfo.health = octopus.health;
			// only follow the octopus if you haven't yet lost
			if (drawInfo.hasLost)
			{
				drawInfo.x = 0;
				drawInfo.y = -drawInfo.deathAnimDistance;
				drawInfo.rotation = 0;
				drawInfo.deathAnimDistance += OPTIONS.deathAnimSpeed * elapsedTime;
				//make the octopus fly up
				var lerp1to0 = Math.max(0, 1 - Math.max(0, (OPTIONS.deathAnimFadeLimit - drawInfo.deathAnimDistance) / -OPTIONS.deathAnimFadeLimit));
				//print("dad:" + drawInfo.deathAnimDistance);
				//print("lep:" + lerp1to0);
				var oldAlpha = ctx.globalAlpha;
				ctx.globalAlpha = lerp1to0;
				OctoRender.drawOctopus(ctx, drawInfo);
				ctx.globalAlpha = oldAlpha;
				if (drawInfo.deathAnimDistance > OPTIONS.deathAnimLimit)
				{
					if (OPTIONS.battle) {
						octopus.respawnTimer = OPTIONS.respawnTime;
						octopus.inactive = true;
						drawInfo.deathAnimDistance = 0;
					}
				}
				expression.timer = 100;
			}
			else
			{
				drawInfo.x = 0;
				drawInfo.y = 0;
				drawInfo.rotation = 0;
				OctoRender.drawOctopus(ctx, drawInfo);
			}


			if (OPTIONS.battle && OPTIONS.debug) {
				ctx.save();
				ctx.scale(4, 4);
				drawText(ctx, 0, 0, octopus.netInfo.players.length);
				ctx.restore();
			}

			//change expression
			if (expression.timer > 0)
			{
				expression.timer--;
			}
			else
			{
				expression.timer = 0;
				expression.img = drawInfo.images.bodyNormal;
			}
			var legsInfo = octopus.getLegsInfo();
			for (var ii = 0; ii < legsInfo.length; ++ii)
			{
				var legInfo = legsInfo[ii];
				//start leg animation
				if (legInfo.upTime > g_clock)
				{
					legMovement[ii] = Math.min(OPTIONS.legScrunch, legMovement[ii] + OPTIONS.legScrunchSpeed * elapsedTime);
				}
				else
				{
					legMovement[ii] = Math.max(0, legMovement[ii] - OPTIONS.legUnscrunchSpeed * elapsedTime);
				}
			}
			//increment leg animation
			if (OPTIONS.debug)
			{
				var color = octopus.inCollision ? "red" : "white";
				if (octopus.touching)
				{
					color = "yellow";
				}
				if (jj == g_selected && Math.floor(g_clock * 4) % 2)
				{
					color = "black";
				}
				drawCircleLine(ctx, 0, 0, OPTIONS.octopusRadius, color);
			}
			ctx.restore();
		}

		InkSystem.drawInks(ctx, elapsedTime);

		if (OPTIONS.battle && OPTIONS.debug)
		{
			ctx.strokeStyle = "white";
			ctx.strokeRect(minX, minY, dx, dy);
			drawCircle(ctx, centerX, centerY, 5, "white");
		}

		ctx.restore(); // scroll

	} // endif g_gamestate

	if (!OPTIONS.battle && (g_gameState == "play" || g_gameState == "gameover"))
	{
		drawHealthHUD(ctx, g_octopi[0], 20, 20);
	}

	if (!OPTIONS.battle && g_octopi[0].hasLost)
	{
		//display ending splash screen
		drawImageCentered(ctx, g_images.outOfInk.img, g_canvas.width / 2, g_canvas.height / 5);
		drawImageCentered(ctx, g_images.playAgain.img, g_canvas.width / 2, g_canvas.height / 5 + 150);
		ctx.font = "20pt monospace";
		ctx.fillStyle = "white";
		ctx.fillText("You crawled "+g_octopi[0].distanceTraveled+" tentacles before exploding!",
					 g_canvas.width / 4.6, g_canvas.height / 3 + 100);
	}

	if (OPTIONS.debug) {
		if (OPTIONS.battle) {
			drawCircle(ctx, OPTIONS.battleLevelWidth / 2, OPTIONS.battleLevelHeight / 2, 5, "purple");
		}
	}
	ctx.restore(); // for screen scale

	drawScreen(ctx);
	function drawScreen(ctx) {
		var vScale = g_canvas.clientWidth / g_canvas.width;
		var vHeight = g_canvas.height / vScale;
		ctx.save();
		ctx.scale(1, vScale);
		switch (g_gameState)
		{
		case 'title':
			var h1 = g_images.title.img.height;
			var h2 = g_images.play.img.height;
			var h = h1 + h2;
			//print("h1:" + h1);
			//print("h2:" + h2);
			drawImageCentered(ctx, g_images.title.img, g_canvas.width / 2, vHeight / 2 - h / 4);
			drawImageCentered(ctx, g_images.play.img, g_canvas.width / 2, vHeight / 2 - h / 4 + h / 2 + 20);
			break;
		case 'tutorial':
			drawImageCentered(ctx, g_images.tutorial.img, g_canvas.width / 2, vHeight / 2);
			break;
		case 'play':
			if (OPTIONS.battle && g_numActiveOctopi == 0) {
				drawImageCentered(ctx, g_images.title.img, g_canvas.width / 2, vHeight / 2);
			}
		}
		ctx.restore();
	}
}

function drawCircle(ctx, x, y, radius, color)
{
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2, false);
	ctx.fill();
}

function drawCircleLine(ctx, x, y, radius, color)
{
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
	var inkSpawners = [];

	function drawInks(ctx, elapsedTime)
	{
		var ii;
		for (ii = 0; ii < inks.length; ++ii)
		{
			var ink = inks[ii];
			if (g_clock < ink.time)
			{
				break;
			}
		}
		inks.splice(0, ii);

		for (ii = 0; ii < inkSpawners.length; ++ii)
		{
			var spawner = inkSpawners[ii];
			if (spawner.inkCount > 0)
			{
				break;
			}
		}
		inkSpawners.splice(0, ii);

		for (var ii = 0; ii < inkSpawners.length; ++ii)
		{
			var spawner = inkSpawners[ii];
			if (spawner.inkTime < g_clock && spawner.inkCount > 0)
			{
				spawner.inkTime = g_clock + OPTIONS.inkLeakDuration / OPTIONS.inkCount;
				var octoInfo = g_octopi[spawner.octoIndex].getInfo();
				birthInk(octoInfo.x + spawner.inkXOff, octoInfo.y + spawner.inkYOff);
				--spawner.inkCount;
			}
		}

		var alpha = ctx.globalAlpha;
		for (var ii = 0; ii < inks.length; ++ii)
		{
			var ink = inks[ii];
			var img = ink.img;
			ink.rot += ink.rotVel * elapsedTime;
			var lerp1to0 = (ink.time - g_clock) / OPTIONS.inkDuration;
			var scale = 0.5 + (1 - lerp1to0) * OPTIONS.inkScale;
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

	function birthInk(x, y)
	{
		var ink = {
			x: x,
			y: y,
			img: g_images[inkImages[randInt(inkImages.length)]].img,
			rot: Math.random() * Math.PI * 2,
			rotVel: (Math.random() - 0.5) * Math.PI,
			time: g_clock + OPTIONS.inkDuration
		};
		inks.push(ink);
	}

	function startInk(octoIndex, x, y)
	{
		inkSpawners.push({
			octoIndex: octoIndex,
			inkXOff: x,
			inkYOff: y,
			inkCount: OPTIONS.inkCount,
			inkTime: 0
		});
	}

	return {
		birthInk: birthInk,
		drawInks: drawInks,
		startInk: startInk,

		dummy: undefined
	}
}());

