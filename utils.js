
$ = function(id) {
  return document.getElementById(id);
}

var getURLOptions = function(obj) {
  var s = window.location.href;
  var q = s.indexOf("?");
  var e = s.indexOf("#");
  if (e < 0) {
    e = s.length;
  }
  var query = s.substring(q + 1, e);
  var pairs = query.split("&");
  for (var ii = 0; ii < pairs.length; ++ii) {
    var keyValue = pairs[ii].split("=");
    var key = keyValue[0];
    var value = decodeURIComponent(keyValue[1]);
    try {
      value = parseFloat(value);
    } catch (e) {
    }
    obj[key] = value;
  }
};

function log(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
}


// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

/**
 * Provides cancelRequestAnimationFrame in a cross browser way.
 */
window.cancelRequestAnimFrame = (function() {
  return window.cancelCancelRequestAnimationFrame ||
         window.webkitCancelRequestAnimationFrame ||
         window.mozCancelRequestAnimationFrame ||
         window.oCancelRequestAnimationFrame ||
         window.msCancelRequestAnimationFrame ||
         window.clearTimeout;
})();


(function(){
  /**
   * A random seed for the pseudoRandom function.
   * @private
   * @type {number}
   */
  var randomSeed_ = 0;

  /**
   * A constant for the pseudoRandom function
   * @private
   * @type {number}
   */
  var RANDOM_RANGE_ = Math.pow(2, 32);

  /*
   * Returns a deterministic pseudorandom number between 0 and 1
   * @return {number} a random number between 0 and 1
   */
  window.pseudoRandom = function() {
    return (randomSeed_ =
            (134775813 * randomSeed_ + 1) %
            RANDOM_RANGE_) / RANDOM_RANGE_;
  };

  /*
   * @return {number} a random number betwen 0 and range - 1
   */
  window.pseudoRandInt = function(range) {
    return Math.floor(window.pseudoRandom() * range);
  }

  /**
   * Resets the pseudoRandom function sequence.
   */
  window.resetPseudoRandom = function() {
    randomSeed_ = 0;
  };
}());

