window.onload = main;

var g_canvas;
var g_ctx;

function resizeCanvas() {
  if (canvas.width != canvas.clientWidth ||
      canvas.height != canvas.clientHeight) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
}

function main() {
  g_canvas = document.getElementById("canvas");
  resizeCanvas();
  g_ctx = g_canvas.getContext("2d");

  drawCircle(g_ctx, g_canvas.width / 2, g_canvas.height / 2, 100, "rgb(200,0,255)");
}

function drawCircle(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2, false);
  ctx.fill();
}
