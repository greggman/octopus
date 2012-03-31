window.onload = main;

var g_canvas;
var g_ctx;
var g_clock = 0;

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
	bodyHappy:
	{
		url: "images/octopus_body.jpg"
	},
	bodyNormal:
	{
		url: "images/octopus_body.jpg"
	},
	bodyDerp:
	{
		url: "images/octopus_body.jpg"
	},
	legTip:
	{
		url: "images/octopus_leg1.jpg"
	},
	legSegment1:
	{
		url: "images/octopus_leg2.jpg"
	},
	legSegment2:
	{
		url: "images/octopus_leg3.jpg"
	}
};

function main() {
  g_canvas = document.getElementById("canvas");
  resizeCanvas();
  g_ctx = g_canvas.getContext("2d");
  LoadAllImages(images, mainLoop);

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

function update(elapsedTime) {
  g_ctx.clearRect(0, 0, g_canvas.width, g_canvas.height);

  OctopusControl.update(elapsedTime);
  var octoInfo = OctopusControl.getInfo();

  drawCircle(
    g_ctx,
    octoInfo.x,
    octoInfo.y,
    100,
    "rgb(200,0,255)");
	
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

