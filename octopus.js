window.onload = main;

var g_canvas;
var g_ctx;
var g_clock = 0;
// World scroll position.
var g_scrollX = 0;
var g_scrollY = 0;

function resizeCanvas() {
  if (g_canvas.width != g_canvas.clientWidth ||
      g_canvas.height != g_canvas.clientHeight) {
    g_canvas.width = g_canvas.clientWidth;
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
        url: "images/urchin01.png"
    },
    background:
    {
        url: "images/octo-background.png"
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
		url: "images/octopus_leg1.png"
	},
	legSegment1:
	{
		url: "images/octopus_leg2.png"
	},
	legSegment2:
	{
      url: "images/octopus_leg3.png"
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

function main() {
  g_canvas = document.getElementById("canvas");
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, true);
  g_ctx = g_canvas.getContext("2d");
  LoadAllImages(images, mainLoop);

  OctopusControl.setLegs(LegsInfo);
  OctopusControl.setInfo(g_canvas.width / 2, g_canvas.height / 2, 0);

  var then = getTime();
  function mainLoop() {
    var now = getTime();
    var elapsedTime = now - then;
    then = now;
    g_clock += elapsedTime;

    update(elapsedTime);

    requestAnimFrame(mainLoop, g_canvas);
  }
  
}

function drawBackground(ctx) {
  var img = images.background.img;
  var imageWidth = img.width;
  var imageHeight = img.height;
  var tilesAcross = (g_canvas.width + imageWidth - 1) / imageWidth + 1;
  var tilesDown = (g_canvas.height + imageHeight - 1) / imageHeight + 1;
  var sx = Math.floor(g_scrollX);
  var sy = Math.floor(g_scrollY);
  if (sx < 0) {
    sx = sx - (Math.floor(sx / imageWidth) + 1) * imageWidth;
  }
  if (sy < 0) {
    sy = sy - (Math.floor(sy / imageHeight) + 1) * imageHeight;
  }
  ctx.save();
  ctx.translate(-sx, -sy);
  for (var yy = 0; yy < tilesDown; ++yy) {
    for (var xx = 0; xx < tilesAcross; ++xx) {
      ctx.drawImage(img, xx * imageWidth, yy * imageHeight);
    }
  }
  ctx.restore();
}

function update(elapsedTime) {
  g_ctx.clearRect(0, 0, g_canvas.width, g_canvas.height);
  g_scrollX += elapsedTime * 20;
  g_scrollY += elapsedTime * 20;
  drawBackground(g_ctx);

  OctopusControl.update(elapsedTime);
  var octoInfo = OctopusControl.getInfo();

  g_ctx.save();
  g_ctx.translate(octoInfo.x, octoInfo.y);
  g_ctx.rotate(octoInfo.rotation);
  drawCircle(g_ctx, 0, 0, 100, "rgb(200,0,255)");
  for (var ii = 0; ii < LegsInfo.length; ++ii) {
    var legInfo = LegsInfo[ii];
    g_ctx.save();
    g_ctx.rotate(legInfo.rotation);
    g_ctx.translate(0, 100);
    drawCircle(g_ctx, 0, 0, 15,
               g_clock < legInfo.upTime ? "rgb(255,0,255)" :"rgb(150, 0, 233)");
    g_ctx.restore();
  }
  drawCircle(g_ctx, 0, 80, 10, "rgb(255,255,255)");
  drawCircle(g_ctx, 0, 82, 5, "rgb(0,0,0)");
  g_ctx.restore();
	
	drawOctopusBody(images.bodyNormal, octoInfo.x, octoInfo.y, octoInfo.rotation, g_ctx);
}

function drawCircle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.fill();
}

function LoadImage(url, callback)
{
	var image = new Image();
	image.onload = callback;
	image.src = url;
	return image;
}

function drawLeg(baseX, baseY, rotation, ctx)
{
	//draw tip
	ctx.save();
	ctx.drawImage(images.legTip.img, tipX, tipY);
	base.x = baseX + images.legTip.img.width;
	base.y = baseY + images.legTip.img.height;
	ctx.save();
	ctx.rotate(rotation * .3);
	ctx.drawImage(images.legSegment1.img, base.x, base.y);
	ctx.save();
	ctx.rotate(rotation * .6);
	ctx.drawImage(images.legSegment2.img, base.x, base.y);
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
				console.log("count"+count);
				count--; 
				if(count == 0)
				{
					callback();
				}
			}
		);
	}
}

