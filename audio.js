tdl.provide('audio');

// To play a sound, simply call audio.play_sound(id), where id is
// one of the keys of the g_sound_files array, e.g. "damage".
audio = (function() {
  var g_context;
  var g_audioMgr;
  var g_sound_bank = {};
  var g_can_play = false;

  function WebAudioSound(name, filename, samples) {
    this.name = name;
    var that = this;
    var req = new XMLHttpRequest();
    req.open("GET", filename, true);
    req.responseType = "arraybuffer";
    req.onload = function() {
      that.buffer = g_context.createBuffer(req.response, true);
    }
    req.addEventListener("error", function(e) {
      tdl.log("failed to load:", filename, " : ", e.target.status);
    }, false);
    req.send();
  }

  WebAudioSound.prototype.play = function() {
    if (!this.buffer) {
      tdl.log(this.name, " not loaded");
      return;
    }
    var src = g_context.createBufferSource();
    src.buffer = this.buffer;
    src.connect(g_context.destination);
    src.noteOn(0);
  };

  function AudioTagSound(name, filename, samples) {
    this.waiting_on_load = samples;
    this.samples = samples;
    this.name = name;
    this.play_idx = 0;
    this.audio = {};
    for (var i = 0; i < samples; i++) {
      var audio = new Audio();
      var that = this;
      audio.addEventListener("canplaythrough", function() {
        that.waiting_on_load--;
      }, false);
      audio.src = filename;
      //audio.onerror = handleError(filename, audio);
      audio.load();
      this.audio[i] = audio;
    }
  };

  AudioTagSound.prototype.play = function() {
    if (this.waiting_on_load > 0) {
      tdl.log(this.name, " not loaded");
      return;
    }
    this.play_idx = (this.play_idx + 1) % this.samples;
    var a = this.audio[this.play_idx];
    // tdl.log(this.name, ":", this.play_idx, ":", a.src);
    var b = new Audio();
    b.src = a.src;
    b.addEventListener("canplaythrough", function() {
      b.play();
      }, false);
    b.load();
  };

    function handleError(filename, audio) {
        return function(e) {
          tdl.log("can't load ", filename);
          /*
          if (filename.substr(filename.length - 4) == ".ogg") {
            filename = filename.substr(0, filename.length - 4) + ".mp3";
            tdl.log("trying ", filename);
            audio.src = filename;
            audio.onerror = handleError(filename, audio);
            audio.load();
          } else if (filename.substr(filename.length - 4) == ".mp3") {
            filename = filename.substr(0, filename.length - 4) + ".wav";
            tdl.log("trying ", filename);
            audio.src = filename;
            audio.onerror = handleError(filename, audio);
            audio.load();
          }
          */
        }
    }

  function init(sounds) {
    var a = new Audio()
    g_can_play = a.canPlayType("audio/ogg") || a.canPlayType("audio/mp3");
    if (!g_can_play)
      return;

    var create;
    if (window.webkitAudioContext) {
      tdl.log("Using Web Audio API");
      g_context = new webkitAudioContext();
      create = WebAudioSound;
    } else {
      tdl.log("Using Audio Tag");
      create = AudioTagSound;
    }

    for (sound in sounds) {
      var data = sounds[sound];
      g_sound_bank[sound] = new create(sound, data.filename, data.samples);
    }
  }

  function play_sound(name) {
    if (!g_can_play)
      return;
    var sound = g_sound_bank[name];
    if (!sound) {
      console.error("audio: '" + name + "' not known.");
      return;
    }
    sound.play();
  }

  return {
    init: init,
    play_sound: play_sound,
  };
})();
