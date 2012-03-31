InputSystem = (function(){
  // Direction Events
  var N  = 0;
  var NE = 1;
  var E  = 2;
  var SE = 3;
  var S  = 4;
  var SW = 5;
  var W  = 6;
  var NE = 7;

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
      time: getTime()
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
    var now = getTime();
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

  var motion = [
  { x:  0, y: -1 }, // N
  { x:  1, y: -1 }, // NE
  { x:  1, y:  0 }, // E
  { x:  1, y:  1 }, // SE
  { x:  0, y:  1 }, // S
  { x: -1, y:  1 }, // SW
  { x: -1, y:  0 }, // E
  { x: -1, y: -1 }, // NW
  ];

  var xVel = 0;
  var yVel = 0;
  var xAccel = 0;
  var yAccel = 0;

  var octoInfo = {
    x: 0,
    y: 0,
    rotation: 0
  };

LEG_FRICTION = 0.9;
LEG_ACCELERATION = 50;
LEG_UP_DURATION = 1.5;
  var NUM_LEGS = 8;
  var legs = [
  ];

  for (var ii = 0; ii < NUM_LEGS; ++ii) {
    var leg = {
      upTime: 0
    };
    legs.push(leg);
  }

  function handleDirection(event) {
    console.log(event.direction);
    var leg = legs[event.direction];
    if (leg.upTime < g_clock) {
      leg.upTime = g_clock + LEG_UP_DURATION;
      xAccel += motion[event.direction].x * LEG_ACCELERATION;
      yAccel += motion[event.direction].y * LEG_ACCELERATION;
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
    octoInfo.x += xVel * elapsedTime;
    octoInfo.y += yVel * elapsedTime;
    xVel *= LEG_FRICTION;
    yVel *= LEG_FRICTION;
    xAccel = 0;
    yAccel = 0;
  }

  return {
    getInfo: getInfo,
    setInfo: setInfo,
    update: update,

    dummy: false  // just marks the end.
  }
}());
