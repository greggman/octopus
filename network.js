
var g_socket;
var g_statusElem;
var g_numPlayers = 0;
var g_players = {};
var g_freeSlots = [];

function connect()
{
	if (!window.io)
	{
		log("no socket io");
		g_socket = {
			send: function()
			{
			}
		};
		return;
	}

	if (OPTIONS.battle)
	{
		var numInputs = OPTIONS.numOctopi * 8;
		for (var ii = 0; ii < numInputs; ++ii)
		{
			var side = ii % OPTIONS.numOctopi;
			var slot = Math.floor(ii / OPTIONS.numOctopi);
			g_freeSlots.push(side * 8 + slot);
		}
	}
	else
	{
		for (var ii = 0; ii < 8; ++ii)
		{
			g_freeSlots.push(ii);
		}
	}


	$("online").style.display = "block";
	g_statusElem = $("onlinestatus");
	var url = "http://" + window.location.host;
	log("connecting to: " + url);
//  g_socket = new io.connect(window.location.host, {
//      transports: ['websocket']});
	g_socket = io.connect(url);
	g_socket.on('connect', connected);
	g_socket.on('message', function(obj){
//log("got message");
//log(obj);
				processMessage(obj);
			   });
	g_socket.on('disconnect', disconnected);
}

function sendCmd(cmd, id, data)
{
	g_socket.emit('message',{
		cmd: cmd,
		id: id,
		data: data
	});
}

function connected()
{
	sendCmd("server");
	sendCmd("broadcast", -1,{
		cmd: 'reconnect'
	});
	updateOnlineStatus();
}

function updateOnlineStatus()
{
	g_statusElem.innerHTML = "num players: " + g_numPlayers;
	g_statusElem.style.backgroundColor = "green";
}

function disconnected()
{
	g_statusElem.innerHTML = "disconnected";
	g_statusElem.style.backgroundColor = "red";
	while (g_numPlayers > 0)
	{
		for (var id in g_players)
		{
			removePlayer(id);
			break;
		}
	}
	connect();
}

function sendCmd(cmd, id, data)
{
	g_socket.emit('message',{
		cmd: cmd,
		id: id,
		data: data
	});
}

function processMessage(msg)
{
	switch (msg.cmd)
	{
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

function startPlayer(id)
{
	if (g_freeSlots.length == 0)
	{
		log("too many players");
		return;
	}
	if (g_players[id])
	{
		return;
	}
	++g_numPlayers;
	updateOnlineStatus();
	g_players[id] = new Player(id, g_freeSlots.shift());
}

function updatePlayer(id, msg)
{
	var player = g_players[id];
	if (!player)
	{
		return;
	}

	player.update(msg);
}

function removePlayer(id)
{
	if (g_players[id])
	{
		--g_numPlayers;
		updateOnlineStatus();
		g_players[id].removeFromGame();
		delete g_players[id];
	}
}

g_slotRemap = [
	5,
	2,
	7,
	0,
	6,
	1,
	4,
	3
];

function getLegId(slotId)
{
	return g_slotRemap[slotId % 8];
}

function getTeamId(slotId)
{
	return Math.floor(slotId / 8);
}

function Player(clientId, slotId)
{
	this.slotId = slotId;
	this.clientId = clientId
	var teamId = getTeamId(this.slotId);
	this.send({
		cmd: 'id',
		legId: getLegId(this.slotId),
		teamId: teamId,
		hue: g_octopi[teamId].drawInfo.hue
	});
}

Player.prototype.update = function(msg)
{
	//log("player slot:" + this.slotId + ", msg");
	switch (msg.cmd)
	{
	case 'press':
		InputSystem.addEvent(getTeamId(this.slotId), getLegId(this.slotId));
		break;
	}
};

Player.prototype.removeFromGame = function()
{
	g_freeSlots.push(this.slotId);
};

Player.prototype.send = function(cmd)
{
	sendCmd("client", this.clientId, cmd);
};

