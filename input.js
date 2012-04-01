InputSystem = (function(){
  // Direction Events
  var N  = 0;
  var NE = 1;
  var E  = 2;
  var SE = 3;
  var S  = 4;
  var SW = 5;
  var W  = 6;
  var NW = 7;

  var eventQueue = [];
  var MAX_EVENT_TIME = 0.2;
  var listeners = {};

  window.addEventListener('keypress', function(event) {
    switch (event.keyCode) {
    case  54: addEvent(N);  break;  // '6'
    case  51: addEvent(NW); break;  // '3'
    case  56: addEvent(NE); break;  // '8'
    case  97: addEvent(W);  break;  // 'a'
    case  92: addEvent(E);  break;  // '\'
    case 120: addEvent(SW); break;  // 'x'
    case  46: addEvent(SE); break;  // '.'
    case  98: addEvent(S);  break;  // 'b'
    }
  }, false);

  function addEvent(direction) {
    var event = {
      direction: direction,
      time: g_clock
    };
    eventQueue.push(event);
    var list = listeners['direction'];
    if (list) {
      list = list.slice(0);
      for (var ii = 0; ii < list.length; ++ii) {
        list[ii](event);
      }
    }
    removeOldEvents();
  }

  function removeOldEvents() {
    var now = g_clock;
    var ii = 0;
    for (; ii < eventQueue.length; ++ii) {
      var event = eventQueue[ii];
      if (now - event.time < MAX_EVENT_TIME) {
        break;
      }
    }
    eventQueue.splice(0, ii);
  }

  function addEventListener(type, listener) {
    var list = listeners[type];
    if (!list) {
      list = [];
      listeners[type] = list;
    }
    list.push(listener);
  }

  return {
    addEventListener: addEventListener,

    dummy: undefined  // marks end
  }
}());

OctopusControl = (function(){

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

LEG_FRICTION = 0.98;
LEG_ROT_FRICTION = 0.98;
LEG_ACCELERATION = 60;
LEG_UP_DURATION = 0.8;
SHOOT_BACK_VELOCITY = -500;

  function handleDirection(event) {
    var leg = legsInfo[event.direction];
    if (leg.upTime < g_clock) {
      leg.upTime = g_clock + LEG_UP_DURATION;
      var rot = octoInfo.rotation + leg.rotation;
      xAccel -= Math.sin(rot) * LEG_ACCELERATION;
      yAccel += Math.cos(rot) * LEG_ACCELERATION;
      rAccel += leg.rotAccel;
      audio.play_sound('swim');
    }
  }

  InputSystem.addEventListener('direction', handleDirection);

  function getInfo() {
    return octoInfo;
  }

  function setInfo(x, y, rotation) {
    octoInfo.x = x;
    octoInfo.y = y;
    octoInfo.rotation = rotation;
  }

  function setLegs(info) {
    legsInfo = info;
    for (var ii = 0; ii < legsInfo.length; ++ii) {
      var legInfo = legsInfo[ii];
      legInfo.upTime = 0;
      legInfo.rotation = legInfo.rotationInDeg * Math.PI / 180;
      legInfo.rotAccel = legInfo.rotAccelInDeg * Math.PI / 180;
    }
  }

  var lastInfo;
  function update(elapsedTime) {
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
    if (xAccel != 0) {
      lastXAccel = xAccel;
    }
    octoInfo.x += xVel * elapsedTime;
    octoInfo.y += yVel * elapsedTime;
    octoInfo.rotation += rVel * elapsedTime;
    xVel *= LEG_FRICTION;
    yVel *= LEG_FRICTION;
    rVel *= LEG_ROT_FRICTION;
    xAccel = 0;
    yAccel = 0;
    rAccel = 0;

    if (OPTIONS.battle) {
    } else {
      octoInfo.x = Math.max(SIDE_LIMIT, Math.min(LEVEL_WIDTH - SIDE_LIMIT, octoInfo.x));
    }
  }

  function shootBack(other) {
    if (OPTIONS.battle) {
      var dx = other.x - octoInfo.x;
      var dy = other.y - octoInfo.y;
      var l = Math.sqrt(dx * dx + dy * dy);
      if (l > 0.00001) {
        dx /= l;
        dy /= l;
      } else {
        dx = 0;
        dy = 0;
      }
      xAccel = SHOOT_BACK_VELOCITY * dx;
      yAccel = SHOOT_BACK_VELOCITY * dy;
    } else {
      xAccel = -lastXAccel;
      yAccel = SHOOT_BACK_VELOCITY;
    }
  }

  return {
    getInfo: getInfo,
    shootBack: shootBack,
    setInfo: setInfo,
    setLegs: setLegs,
    update: update,

    dummy: false  // just marks the end.
  }
}());
