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
InputSystem = (function(){
	"strict";
	var eventQueues = [];
	var MAX_EVENT_TIME = 0.2;
	var listeners = [];
	var active = false;

	/*

	  7       0

	  6         1

	   5       2
	      4  3

	*/


	window.addEventListener('keypress', function(event) {
		var c = event.keyCode;
		if (!c){
			c = event.charCode;
		}
		switch (String.fromCharCode(c).toLowerCase())
			{
			case '8': addEvent(0, 0); break;
			case 'p': addEvent(0, 1); break;
			case 'm': addEvent(0, 2); break;
			case 'b': addEvent(0, 3); break;
			case 'c': addEvent(0, 4); break;
			case 'z': addEvent(0, 5); break;
			case 'q': addEvent(0, 6); break;
			case '4': addEvent(0, 7); break;
			case '7': addEvent(1, 0); break;
			case 'o': addEvent(1, 1); break;
			case 'n': addEvent(1, 2); break;
			case 'v': addEvent(1, 3); break;
			case 'x': addEvent(1, 4); break;
			case 'a': addEvent(1, 5); break;
			case 'w': addEvent(1, 6); break;
			case '3': addEvent(1, 7); break;

			case '1': addEvent(2, 6); break;
			case '2': addEvent(3, 2); break;
			case '0': addEvent(4, 6); break;
			case '9': addEvent(5, 2); break;
			case '-': addEvent(6, 6); break;
			case '=': addEvent(7, 2); break;
			case '6': addEvent(8, 6); break;
			case '5': addEvent(9, 2); break;
			case ' ': addEvent(randInt(g_octopi.length), randInt(8)); break;
		}
	}, false);

	function getEventQueue(player){
		var eventQueue = eventQueues[player];
		if (!eventQueue){
			eventQueue = [];
			eventQueues[player] = eventQueue;
		}
		return eventQueue;
	}

	function getListeners(player, type){
		var playerListeners = listeners[player];
		if (!playerListeners){
			playerListeners = {};
			listeners[player] = playerListeners;
		}
		var list = playerListeners[type];
		if (!list){
			list = [];
			playerListeners[type] = list;
		}
		return list;
	}

	function addEvent(player, direction){
		if (!active){
			return;
		}
		var event = {
			direction: direction,
			time: g_clock
		};
		var eventQueue = getEventQueue(player);
		eventQueue.push(event);
		var list = getListeners(player, 'direction');
		if (list){
			list = list.slice(0);
			for (var ii = 0; ii < list.length; ++ii){
				list[ii](event);
			}
		}
		removeOldEvents(player);
	}

	function removeOldEvents(player){
		var eventQueue = getEventQueue(player);
		var now = g_clock;
		var ii = 0;
		for (; ii < eventQueue.length; ++ii){
			var event = eventQueue[ii];
			if (now - event.time < MAX_EVENT_TIME){
				break;
			}
		}
		eventQueue.splice(0, ii);
	}

	function addEventListener(player, type, listener){
		var list = getListeners(player, [type]);
		list.push(listener);
	}

	function startInput(){
		active = true;
	}

	function stopInput(){
		active = false;
	}

	return{
		addEventListener: addEventListener,
		addEvent: addEvent,
		startInput: startInput,
		stopInput: stopInput,

		dummy: undefined	// marks end
	}
}());

var OctopusControl = function(player)
{
	"strict";
	var legsInfo;
	var xVel = 0;
	var yVel = 0;
	var rVel = 0;
	var xAccel = 0;
	var yAccel = 0;
	var rAccel = 0;
	var lastXAccel = 0;

	var octoInfo = {
		x: 0,
		y: 0,
		rotation: 0
	};

	function handleDirection(event)
	{
		var leg = legsInfo[event.direction];
		if (leg.upTime < g_clock)
		{
			leg.upTime = g_clock + OPTIONS.LEG_UP_DURATION;
			var rot = octoInfo.rotation + leg.rotation;
			xAccel -= Math.sin(rot) * OPTIONS.LEG_ACCELERATION;
			yAccel += Math.cos(rot) * OPTIONS.LEG_ACCELERATION;
			rAccel += leg.rotAccel;
			audio.play_sound('swim');
		}
	}

	InputSystem.addEventListener(player, 'direction', handleDirection);

	function getInfo()
	{
		return octoInfo;
	}

	function setInfo(x, y, rotation)
	{
		octoInfo.x = x;
		octoInfo.y = y;
		octoInfo.rotation = rotation;
	}

	function getLegsInfo()
	{
		return legsInfo;
	}

	function setLegs(info)
	{
		legsInfo = JSON.parse(JSON.stringify(info));
		for (var ii = 0; ii < legsInfo.length; ++ii)
		{
			var legInfo = legsInfo[ii];
			legInfo.upTime = 0;
		}
	}

	var lastInfo;
	function update(elapsedTime)
	{
//    info =
//    "xa: " + xAccel + " ya:" + yAccel +
//    "xv: " + xVel   + " yv:" + yVel +
//    "x:"   + octoInfo.x + " y:" + octoInfo.y;
//    if (lastInfo != info) {
//      console.log(info);
//      lastInfo = info;
//    }

		xVel += xAccel;
		yVel += yAccel;
		rVel += rAccel;
		if (xAccel != 0)
		{
			lastXAccel = xAccel;
		}
		octoInfo.x += xVel * elapsedTime;
		octoInfo.y += yVel * elapsedTime;
		octoInfo.rotation += rVel * elapsedTime;
		xVel *= OPTIONS.LEG_FRICTION;
		yVel *= OPTIONS.LEG_FRICTION;
		rVel *= OPTIONS.LEG_ROT_FRICTION;
		xAccel = 0;
		yAccel = 0;
		rAccel = 0;

		if (OPTIONS.battle)
		{
		}
		else
		{
			octoInfo.x = Math.max(OPTIONS.SIDE_LIMIT, Math.min(OPTIONS.LEVEL_WIDTH - OPTIONS.SIDE_LIMIT, octoInfo.x));
		}
	}

	function shootBack(other)
	{
		if (OPTIONS.battle)
		{
			var dx = other.x - octoInfo.x;
			var dy = other.y - octoInfo.y;
			var l = Math.sqrt(dx * dx + dy * dy);
			if (l > 0.00001)
			{
				dx /= l;
				dy /= l;
			}
			else
			{
				dx = 0;
				dy = 0;
			}
			xAccel = OPTIONS.SHOOT_BACK_VELOCITY * dx;
			yAccel = OPTIONS.SHOOT_BACK_VELOCITY * dy;
		}
		else
		{
			xAccel = -lastXAccel;
			yAccel = OPTIONS.SHOOT_BACK_VELOCITY;
		}
	}

	return {
		getLegsInfo: getLegsInfo,
		getInfo: getInfo,
		shootBack: shootBack,
		setInfo: setInfo,
		setLegs: setLegs,
		update: update,

		dummy: false  // just marks the end.
	}
};
