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

