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

images = {Octopus1:
	{
		url: "images/octopus1.jpg",
	},
	Octopus2:
	{
		url: "images/octopus2.jpg"
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


function update(elapsedTime) {
  g_ctx.clearRect(0, 0, g_canvas.width, g_canvas.height);

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
  drawCircle(g_ctx, 0, -80, 10, "rgb(255,255,255)");
  drawCircle(g_ctx, 0, -82, 5, "rgb(0,0,0)");
  g_ctx.restore();
	
	g_ctx.drawImage(images.Octopus1.img, 0,0);
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

