window.onload = main;

var g_canvas;
var g_ctx;
var g_clock = 0;

function resizeCanvas() {
  if (canvas.width != canvas.clientWidth ||
      canvas.height != canvas.clientHeight) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
}

function getTime() {
  return (new Date()).getTime() * 0.001;
}

function main() {
  g_canvas = document.getElementById("canvas");
  resizeCanvas();
  g_ctx = g_canvas.getContext("2d");

  var then = getTime();
  function mainLoop() {
    var now = getTime();
    var elapsedTime = now - then;
    then = now;
    g_clock += elapsedTime;

    update(elapsedTime);

    requestAnimFrame(mainLoop, g_canvas);
  }
  mainLoop();
}

function update(elapsedTime) {
  g_ctx.clearRect(0, 0, g_canvas.width, g_canvas.height);
  drawCircle(
    g_ctx,
    g_canvas.width / 2 + Math.sin(g_clock) * 100,
    g_canvas.height / 2 + Math.cos(g_clock) * 100,
    100,
    "rgb(200,0,255)");
}

function drawCircle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.fill();
}
