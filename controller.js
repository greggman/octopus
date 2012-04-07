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

var g_socket;
var g_statusElem;
var g_images;
var g_canvas;
var g_ctx;

var OPTIONS = {
};

MergeOptions(OPTIONS, OctoRender.getOptions());
getURLOptions(OPTIONS);

function debug(msg) {
  log(msg);
  var d = document.getElementById("debug");
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(msg));
  d.appendChild(div);
}

function main() {
  g_canvas = $("canvas");
  g_ctx = g_canvas.getContext("2d");
  g_images = OctoRender.getImages();
  LoadImages(g_images, renderOctopus);
  debug("start");
  connect();
  window.addEventListener('mousedown', press, false);
  window.addEventListener('touchstart', press, false);
  window.addEventListener('keypress', press, false);
}

function renderOctopus() {
	var expression = {
		img: g_images.bodyNormal
	};
	var drawInfo = {
		x: 0,
		y: 0,
		rotation: 0,
		images: g_images,
		legsInfo: OctoRender.getLegsInfo(),
		legMovement: [0, 0, 0, 0, 0, 0, 0, 0],
		expression: expression,
		clock: 0
	};
	var ctx = g_ctx;
	ctx.save();
	ctx.translate(g_canvas.width * 0.5, g_canvas.height * 0.5);
  OctoRender.drawOctopus(ctx, drawInfo);
	ctx.restore();
}

function press() {
  debug("press");
  sendCmd("update", {
    cmd: 'press',
    buttonId: 0,
  });
}

function connect() {
  if (!window.io) {
    g_socket = {
      send: function() { }
    };
    return;
  }
  $("online").style.display = "block";
  g_statusElem = $("onlinestatus");
  var url = "http://" + window.location.host;
  debug("connecting to: " + url);
  g_socket = io.connect(url);
  g_socket.on('connect', connected);
  g_socket.on('message', function(obj) {
    processMessage(obj);
  });
  g_socket.on('disconnect', disconnected);
}

function connected() {
  g_statusElem.innerHTML = "connected";
  g_statusElem.style.backgroundColor = "green";
}

function disconnected() {
  g_statusElem.innerHTML = "disconnected";
  g_statusElem.style.backgroundColor = "red";
}

function sendCmd(cmd, data) {
  g_socket.emit('message', {
    cmd: cmd,
    data: data
  });
}

function processMessage(msg) {
  debug(msg);
  switch (msg.cmd) {
  case 'update':
    switch (msg.data.cmd) {
    case 'reconnect':
      disconnect();
      connect();
    }
    break;
  }
}

