var plugin = include('registry');

plugin.register({
  id: 'fx_sound',
  name: 'Ses Sistemi',
  type: 'core',
  version: '3.0',
  description: 'Howler.js tabanli ses motoru — multi-variant, random play, 3D pozisyonel',
  priority: -100,

  _sounds: {},
  _bank: {},
  _masterVol: 1,
  _musicVol: 0.5,
  _sfxVol: 0.8,
  _ready: false,
  _initQueue: [],
  _unlocked: false,

  init(game) {
    if (typeof Howl === 'undefined') {
      console.warn('[fx_sound] Howler.js yuklu degil');
      return;
    }

    game.sound = this;
    this._sounds = {};
    if (!this._bank) this._bank = {};

    var self = this;
    var _resumeAudio = function() {
      self._unlock();
      document.removeEventListener('touchstart', _resumeAudio);
      document.removeEventListener('click', _resumeAudio);
      document.removeEventListener('keydown', _resumeAudio);
    };
    document.addEventListener('touchstart', _resumeAudio);
    document.addEventListener('click', _resumeAudio);
    document.addEventListener('keydown', _resumeAudio);

    for (var i = 0; i < this._initQueue.length; i++) {
      var q = this._initQueue[i];
      this._createFromBank(q.id, q.bankId);
    }
    this._initQueue = [];
    this._ready = true;
  },

  _unlock() {
    if (this._unlocked) return;
    try {
      if (Howler && Howler.ctx) {
        if (Howler.ctx.state === 'suspended') {
          Howler.ctx.resume();
        }
        var silent = Howler.ctx.createBufferSource();
        silent.buffer = Howler.ctx.createBuffer(1, 1, 22050);
        silent.connect(Howler.ctx.destination);
        silent.start(0);
        this._unlocked = true;
      }
    } catch (e) {}
  },

  addSound(id, opts) {
    if (this._bank[id]) {
      if (typeof devconsoleLog === 'function') devconsoleLog('warn', '[fx_sound] ATLANDI (zaten var): ' + id);
      return;
    }
    if (typeof devconsoleLog === 'function') devconsoleLog('log', '[fx_sound] EKLENDI: ' + id + ' (' + (opts.variants ? opts.variants.length : 1) + ' varyant)');
    if (opts.src) {
      opts.variants = [{
        src: opts.src,
        volume: opts.volume || 1,
        loop: opts.loop || false,
        rate: opts.rate || 1
      }];
      delete opts.src;
      delete opts.volume;
      delete opts.loop;
      delete opts.rate;
    }
    if (!opts.variants) opts.variants = [];
    this._bank[id] = opts;
    if (this._ready) this._createFromBank(id);
  },

  _getVariants(id) {
    var def = this._bank[id];
    if (!def) return null;
    return def.variants || [];
  },

  _resumeCtx() {
    if (this._unlocked) return;
    try {
      if (Howler && Howler.ctx) {
        if (Howler.ctx.state === 'suspended') {
          Howler.ctx.resume();
        }
        var silent = Howler.ctx.createBufferSource();
        silent.buffer = Howler.ctx.createBuffer(1, 1, 22050);
        silent.connect(Howler.ctx.destination);
        silent.start(0);
        this._unlocked = true;
      }
    } catch (e) {}
  },

  _pickVariantIndex(id) {
    var def = this._bank[id];
    if (!def) return 0;
    var variants = def.variants || [];
    if (variants.length === 0) return -1;
    if (def.randomPlay) {
      return Math.floor(Math.random() * variants.length);
    }
    var idx = def.currentIndex || 0;
    if (idx >= variants.length) idx = 0;
    return idx;
  },

  loadSound(id) {
    var def = this._bank[id];
    if (!def) return null;

    if (!this._ready) {
      this._initQueue.push({ id: id, bankId: id });
      return null;
    }

    this._createFromBank(id, id);
    return this._sounds[id];
  },

  _createFromBank(soundId) {
    if (this._sounds[soundId]) return;

    var opts = this._bank[soundId];
    if (!opts) return;
    if (!opts.variants || opts.variants.length === 0) return;

    var spatial = opts.spatial !== false;
    var howls = [];
    for (var i = 0; i < opts.variants.length; i++) {
      var v = opts.variants[i];
      if (!v || !v.src) { howls.push(null); continue; }
      try {
        var cfg = {
          src: v.src,
          loop: v.loop || false,
          volume: v.volume !== undefined ? v.volume : 1,
          rate: v.rate || 1,
          onloaderror: function(sid, idx) {
            return function() {
              if (typeof devconsoleLog === 'function') devconsoleLog('warn', '[fx_sound] Yuklenemedi: ' + sid + '[' + idx + ']');
            };
          }(soundId, i)
        };
        if (spatial) {
          cfg.pannerAttr = {
            panningModel: 'HRTF',
            distanceModel: 'inverse',
            refDistance: 3,
            maxDistance: 50,
            rolloffFactor: 1
          };
        }
        howls.push(new Howl(cfg));
      } catch (e) {
        howls.push(null);
      }
    }
    this._sounds[soundId] = howls;
  },

  play(id) {
    if (!this._ready) return null;
    this._resumeCtx();

    var howls = this._sounds[id];
    if (!howls) this._createFromBank(id);
    if (this._sounds[id]) howls = this._sounds[id];
    if (!howls || howls.length === 0) return null;

    var idx = this._pickVariantIndex(id);
    if (idx < 0 || idx >= howls.length) return null;
    var h = howls[idx];
    if (!h) return null;
    return h.play();
  },

  playAt(id, position) {
    if (!this._ready) return null;
    this._resumeCtx();

    var howls = this._sounds[id];
    if (!howls) this._createFromBank(id);
    if (this._sounds[id]) howls = this._sounds[id];
    if (!howls || howls.length === 0) return null;

    var idx = this._pickVariantIndex(id);
    if (idx < 0 || idx >= howls.length) return null;
    var h = howls[idx];
    if (!h) return null;

    var playId = h.play();
    if (playId !== null && position) {
      h.pos(position.x, position.y, position.z, playId);
    }
    return playId;
  },

  updateListener(camera) {
    if (!Howler || !Howler.pos) return;
    try {
      var p = camera.position;
      Howler.pos(p.x, p.y, p.z);

      var fwd = new THREE.Vector3(0, 0, -1);
      fwd.applyQuaternion(camera.quaternion);
      var up = new THREE.Vector3(0, 1, 0);
      up.applyQuaternion(camera.quaternion);
      Howler.orientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z);
    } catch (e) {}
  },

  stop(id) {
    var howls = this._sounds[id];
    if (!howls) return;
    for (var i = 0; i < howls.length; i++) {
      if (howls[i]) howls[i].stop();
    }
  },

  fadeIn(id, duration) {
    duration = duration || 1000;
    this._resumeCtx();
    var howls = this._sounds[id];
    if (!howls) this._createFromBank(id);
    howls = this._sounds[id];
    if (!howls || howls.length === 0) return;

    var idx = this._pickVariantIndex(id);
    if (idx < 0 || idx >= howls.length) return;
    var h = howls[idx];
    if (!h) return;

    var def = this._bank[id];
    var vol = 1;
    if (def && def.variants && def.variants[idx]) {
      vol = def.variants[idx].volume || 1;
    }
    h.volume(0);
    h.play();
    h.fade(0, vol, duration);
  },

  fadeOut(id, duration) {
    duration = duration || 1000;
    var howls = this._sounds[id];
    if (!howls) return;
    for (var i = 0; i < howls.length; i++) {
      var h = howls[i];
      if (!h) continue;
      h.fade(h.volume(), 0, duration);
    }
    var self = this;
    setTimeout(function() {
      for (var i = 0; i < howls.length; i++) {
        if (howls[i]) {
          howls[i].stop();
        }
      }
    }, duration + 50);
  },

  setMasterVolume(v) {
    this._masterVol = v;
    Howler.volume(v);
  },

  setMusicVolume(v) {
    this._musicVol = v;
  },

  setSfxVolume(v) {
    this._sfxVol = v;
  },

  stopAll() {
    Howler.stop();
  },

  mute() {
    Howler.mute(true);
  },

  unmute() {
    Howler.mute(false);
  },

  destroy() {
    this.stopAll();
    this._sounds = {};
    this._ready = false;
    if (game) delete game.sound;
  }
});
