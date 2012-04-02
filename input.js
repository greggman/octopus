InputSystem = (function(){
  var eventQueue = [];
  var MAX_EVENT_TIME = 0.2;
  var listeners = {};
  var active = false;

  /*

      7       0

     6         1

      5       2
         4  3

  */


  window.addEventListener('keypress', function(event) {
    switch (String.fromCharCode(event.keyCode).toLowerCase()) {
    case '8': addEvent(0); break;
    case 'p': addEvent(1); break;
    case 'm': addEvent(2); break;
    case 'b': addEvent(3); break;
    case 'c': addEvent(4); break;
    case 'z': addEvent(5); break;
    case 'q': addEvent(6); break;
    case '4': addEvent(7); break;
    }
  }, false);

  function addEvent(direction) {
    if (!active) {
      return;
    }
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

  function startInput() {
    active = true;
  }

  function stopInput() {
    active = false;
  }

  return {
    addEventListener: addEventListener,
    addEvent: addEvent,
    startInput: startInput,
    stopInput: stopInput,

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

  function handleDirection(event) {
    var leg = legsInfo[event.direction];
    if (leg.upTime < g_clock) {
      leg.upTime = g_clock + OPTIONS.LEG_UP_DURATION;
      var rot = octoInfo.rotation + leg.rotation;
      xAccel -= Math.sin(rot) * OPTIONS.LEG_ACCELERATION;
      yAccel += Math.cos(rot) * OPTIONS.LEG_ACCELERATION;
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
    xVel *= OPTIONS.LEG_FRICTION;
    yVel *= OPTIONS.LEG_FRICTION;
    rVel *= OPTIONS.LEG_ROT_FRICTION;
    xAccel = 0;
    yAccel = 0;
    rAccel = 0;

    if (OPTIONS.battle) {
    } else {
      octoInfo.x = Math.max(OPTIONS.SIDE_LIMIT, Math.min(OPTIONS.LEVEL_WIDTH - OPTIONS.SIDE_LIMIT, octoInfo.x));
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
      xAccel = OPTIONS.SHOOT_BACK_VELOCITY * dx;
      yAccel = OPTIONS.SHOOT_BACK_VELOCITY * dy;
    } else {
      xAccel = -lastXAccel;
      yAccel = OPTIONS.SHOOT_BACK_VELOCITY;
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
