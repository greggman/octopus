var g_socket;
var g_statusElem;
var g_numPlayers = 0;
var g_players = {};
var g_freeSlots = [];

function connect() {
  if (!window.io) {
    log("no socket io");
    g_socket = {
      send: function() { }
    };
    return;
  }

  var numSlots = OPTIONS.battle ? 16 : 8;
  for (var ii = 0; ii < numSlots; ++ii) {
    g_freeSlots.push(ii);
  }


  $("online").style.display = "block";
  g_statusElem = $("onlinestatus");
  var url = "http://" + window.location.host;
  log("connecting to: " + url);
//  g_socket = new io.connect(window.location.host, {
//      transports: ['websocket']});
  g_socket = io.connect(url);
  g_socket.on('connect', connected);
  g_socket.on('message', function(obj) {
log("got message");
log(obj);
    processMessage(obj);
  });
  g_socket.on('disconnect', disconnected);
}

function sendCmd(cmd, id, data) {
  g_socket.emit('message', {
    cmd: cmd,
    id: id,
    data: data
  });
}

function connected() {
  sendCmd("server");
  sendCmd("broadcast", -1, {
    cmd: 'reconnect'
  });
  updateOnlineStatus();
}

function updateOnlineStatus() {
  g_statusElem.innerHTML = "num players: " + g_numPlayers;
  g_statusElem.style.backgroundColor = "green";
}

function disconnected() {
  g_statusElem.innerHTML = "disconnected";
  g_statusElem.style.backgroundColor = "red";
  while (g_numPlayers > 0) {
    for (var id in g_players) {
      removePlayer(id);
      break;
    }
  }
  connect();
}

function sendCmd(cmd, id, data) {
  g_socket.emit('message', {
    cmd: cmd,
    id: id,
    data: data
  });
}

function processMessage(msg) {
  switch (msg.cmd) {
  case 'start':
    startPlayer(msg.id);
    break;
  case 'update':
    updatePlayer(msg.id, msg.data);
    break;
  case 'remove':
    removePlayer(msg.id);
    break;
  }
}

function startPlayer(id) {
  if (g_freeSlots.length == 0) {
    log("too many players");
    return;
  }
  if (g_players[id]) {
    return;
  }
  ++g_numPlayers;
  updateOnlineStatus();
  g_players[id] = new Player(g_freeSlots.shift());
}

function updatePlayer(id, msg) {
  var player = g_players[id];
  if (!player) {
    return;
  }

  player.update(msg);
}

function removePlayer(id) {
  if (g_players[id]) {
    --g_numPlayers;
    updateOnlineStatus();
    g_players[id].removeFromGame();
    delete g_players[id];
  }
}

function Player(slotId) {
  this.slotId = slotId;
}

Player.prototype.update = function(msg) {
  log("player slot:" + this.slotId + ", msg");
  switch (msg.cmd) {
  case 'press':
    if (this.slotId < 8) {
      InputSystem.addEvent(this.slotId);
    }
    break;
  }
};

Player.prototype.removeFromGame = function() {
  g_freeSlots.push(this.slotId);
};
