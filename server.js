g = {
    port: 8080,
    screenshotCount: 0
};


function extension(path) {
  var m = path.match(/\.[^\.]+$/);
  return m ? m[0] : "";
}

var getMimeType = function() {
  var mimeTypeMap = {
    '.jpg':  'image/jpeg',
    '.gif':  'image/gif',
    '.png':  'image/png',
    '.css':  'text/css',
    '.ogg':  'audio/ogg',
    '.wav':  'audio/wav',
    '.mp3':  'audio/mp3',
    '.m4a':  'audio/m4a',
    '.js':   'text/javascript',
    '.json': 'application/json',
    '.html': 'text/html'
  };

  return function(path) {
    var ext = extension(path);
    var mimeType = mimeTypeMap[ext];
    return mimeType;
  }
}();

var applySettings = function(obj, dst) {
  for (var name in obj) {
    var value = obj[name];
    if (typeof value == 'object') {
      if (!dst[name]) {
        dst[name] = {};
      }
      applySettings(value, dst[name]);
      console.log("apply->: ", name);
    } else {
      console.log("apply: ", name, "=", value);
      dst[name] = value;
    }
  }
};

var http = require('http');
var url = require('url');
var fs = require('fs');
var io = require('socket.io');
var sys = require('util');
var path = require('path');
var querystring = require('querystring');

for (var ii = 2; ii < process.argv.length; ++ii) {
    var flag = process.argv[ii];
    //sys.print("" + ii + ":" + flag + "\n");
    switch (flag) {
    case '-h':
    case '--help':
  sys.print(
        "--help: this message\n" +
        "--port: port. Default 8080\n");
    process.exit(0);
    case '--port':
  g.port = parseInt(process.argv[++ii]);
  //sys.print("port: " + g.port + "\n");
  break;
    }
}


function postHandler(request, callback) {
  var query_ = { };
  var content_ = '';

  request.addListener('data', function(chunk) {
    content_ += chunk;
  });

  request.addListener('end', function() {
    query_ = JSON.parse(content_);
    callback(query_);
  });
}

function sendJSONResponse(res, object) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.write(JSON.stringify(object), 'utf8');
  res.end();
}

function startsWith(str, start) {
  return (str.length >= start.length &&
          str.substr(0, start.length) == start);
}

function saveScreenshotFromDataURL(dataURL) {
  var EXPECTED_HEADER = "data:image/png;base64,";
  if (startsWith(dataURL, EXPECTED_HEADER)) {
    var filename = "screenshot-" + (g.screenshotCount++) + ".png";
    fs.writeFile(
        filename,
        dataURL.substr(
            EXPECTED_HEADER.length,
            dataURL.length - EXPECTED_HEADER.length),
        'base64');
    sys.print("Saved Screenshot: " + filename + "\n");
  }
}

server = http.createServer(function(req, res){
sys.print("req: " + req.method + ' ');
  // your normal server code
  if (req.method == "POST") {
    postHandler(req, function(query) {
      sys.print("query: " + query.cmd + '\n');
      switch (query.cmd) {
      case 'time':
        sendJSONResponse(res, { time: (new Date()).getTime() * 0.001 });
        break;
      case 'screenshot':
        saveScreenshotFromDataURL(query.dataURL);
        sendJSONResponse(res, { ok: true });
        break;
      default:
        send404(res);
        break;
      }
    });
  } else {
    var filePath = querystring.unescape(url.parse(req.url).pathname);
    if (filePath == "/") {
      filePath = "/index.html";
    }
    var cwd = process.cwd();
    var fullPath = path.normalize(path.join(cwd, filePath));
    sys.print("path: " + fullPath + "\n");
    if (cwd != fullPath.substring(0, cwd.length)) {
      sys.print("forbidden: " + fullPath + "\n");
      return send403(res);
    }
    var mimeType = getMimeType(fullPath);
    if (mimeType) {
      fs.readFile(fullPath, function(err, data){
        if (err) {
          sys.print("unknown file: " + fullPath + "\n");
          return send404(res);
        }
        if (startsWith(mimeType, "text")) {
          res.writeHead(200, {
            'Content-Type': mimeType + "; charset=utf-8"
          });
          res.write(data, "utf8");
        } else {
          res.writeHead(200, {
            'Content-Type': mimeType,
            'Content-Length': data.length});
          res.write(data);
        }
        res.end();
      });
    } else send404(res);
  }
}),

send404 = function(res){
  res.writeHead(404);
  res.write('404');
  res.end();
};

send403 = function(res){
  res.writeHead(403);
  res.write('403');
  res.end();
};

// socket.io
var buffer = [];

var g_clients = {};
var g_numClients = 0;
var g_servers = {};
var g_numServers = 0;
var g_count = 0;

io = io.listen(server);
sys.print("Listening on port: " + g.port + "\n");
server.listen(g.port);

io.sockets.on('connection', function(client){
  client.sessionId = ++g_count;
  sys.print("connection: cid:" + client.sessionId + "\n");
  addClient(client);

  sendMsgToServer({
      cmd: 'start',
      id: client.sessionId,
  });

  client.on('message', function(message){
    console.log("cid:" + client.sessionId + " msg:" + message);
    processMessage(client, message);
  });

  client.on('disconnect', function() {
    if (!removeServer(client)) {
      sendMsgToServer({
        cmd: 'remove',
        id: client.sessionId,
      });
      removeClient(client);
    }
  });
});

function addClient(client) {
  g_clients[client.sessionId] = client;
  ++g_numClients;
  console.log("add: num clients: " + g_numClients);
}

function removeClient(client) {
  delete g_clients[client.sessionId];
  if (g_numClients) {
    --g_numClients;
    console.log("remove: num clients: " + g_numClients);
    if (g_numClients == 0) {
      console.log("all clients disconnected");
    }
  }
}

function addServer(client) {
  if (!g_servers[client.sessionId]) {
    g_servers[client.sessionId] = client;
    ++g_numServers;
    console.log("add: num servers: " + g_numServers);
    return true;
  }
  return false
}

function removeServer(client) {
  if (!g_servers[client.sessionId]) {
    return false;
  }
  delete g_servers[client.sessionId];
  --g_numServers;
  console.log("remove num servers: " + g_numServers);
  if (g_numServers == 0) {
    console.log("all servers disconnected");
  }
  return true;
}

function sendMsgToServer(msg) {
  if (!g_numServers) {
    console.log("no servers!");
    return;
  }
  for (var id in g_servers) {
    var server = g_servers[id];
    server.emit('message', msg);
    haveServer = true;
  }
}

// --- messages to relay server ---
//
// server:
//   desc: identifies this session as a server
//   args: none
//
// client:
//   desc: sends a message to a specific client
//   args:
//      id:   session id of client
//      data: object
//
// update:
//   desc: sends an update to the game server
//   args:
//      anything

// -- messages to the game server --
//
// update:
//   desc: updates a player
//   args:
//      id: id of player to update
//      data: data
//
// remove:
//   desc: removes a player
//   args:
//      id: id of player to remove.
//

// -- messages to player --
//

function processMessage(client, message) {
  sys.print(JSON.stringify(message));
  switch (message.cmd) {
    case 'server':
      removeClient(client);
      addServer(client);
      g_servers[client.sessionId] = client;
      break;
    case 'client': {
      var client = g_clients[message.id];
      if (client) {
        client.emit('message', message.data);
      } else {
        console.log("no client: " + message.id);
      }
      break;
    }
    case 'broadcast':
      message.cmd = 'update';
      for (var id in g_clients) {
        sys.print("sending to: " + id);
        g_clients[id].emit('message', message);
      }
      break;
    case 'update':
      message.id = client.sessionId;
      sendMsgToServer(message);
      break;
    default:
      console.log("unkonwn message: " + message.cmd);
      break;
  }
}

