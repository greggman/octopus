window.onload = main;

var g_socket;
var g_statusElem;

function main() {
  connect();
  window.addEventListener('mousedown', press);
  window.addEventListener('touchdown', press);
  window.addEventListener('keypress', press);
}

function press() {
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
  log("connecting to: " + url);
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
  log(msg);
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

