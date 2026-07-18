var plugin = include('registry');

plugin.register({
  id: 'core_animation',
  name: 'Animasyon',
  type: 'core',
  description: 'Keyframe animasyon motoru — iskelet pivot interpolasyonu',
  version: '1.0',
  enabled: true,

  init() {
    this.playing = {};
    this.debug = true;
  },

  // Animasyon oynat
  // target: THREE.Object3D (model group)
  // animDef: animations.idle / walk / run / die
  play(target, animDef) {
    if (!target || !animDef) return null;
    if (!this.playing) this.playing = {};
    var id = target.uuid + '_' + Date.now() + '_' + Math.random();
    var state = {
      id: id,
      target: target,
      animDef: animDef,
      elapsed: 0,
      duration: animDef.duration || 1,
      loop: animDef.loop !== false,
      done: false,
      tracks: []
    };

    // Kayitli pivot durumlarini yakala
    for (var i = 0; i < animDef.tracks.length; i++) {
      var tr = animDef.tracks[i];
      var pivot = this._findPivot(target, tr.pivot);
      if (!pivot) {
        if (this.debug) console.warn('[core_animation] pivot bulunamadi:', tr.pivot, 'in', target.name || target.uuid);
        continue;
      }

      var propParts = tr.prop.split('.');
      var obj = pivot;
      for (var p = 0; p < propParts.length - 1; p++) {
        obj = obj[propParts[p]];
      }
      var propName = propParts[propParts.length - 1];

      state.tracks.push({
        pivot: pivot,
        obj: obj,
        prop: propName,
        keys: tr.keys,
        startVal: obj[propName]
      });
    }

    this.playing[id] = state;
    return id;
  },

  // Kare interpolasyonu (deltaTime saniye)
  update(dt) {
    if (!this.playing) this.playing = {};
    if (dt > 0.1) dt = 0.1; // frame spike korumasi
    var toRemove = [];
    for (var id in this.playing) {
      var s = this.playing[id];
      s.elapsed += dt;

      var t = s.elapsed / s.duration;
      var done = false;
      if (t >= 1) {
        if (s.loop) {
          t = t % 1;
          s.elapsed = s.elapsed % s.duration;
        } else {
          t = 1;
          done = true;
        }
      }

      for (var i = 0; i < s.tracks.length; i++) {
        var tr = s.tracks[i];
        if (!tr.pivot) continue;
        var keys = tr.keys;
        var len = keys.length;

        var idx = t * (len - 1);
        var idxA = Math.floor(idx);
        var idxB = Math.min(idxA + 1, len - 1);
        var frac = idx - idxA;

        var val = keys[idxA] + (keys[idxB] - keys[idxA]) * frac;
        tr.obj[tr.prop] = val;
      }

      if (done) {
        toRemove.push(id);
        if (s.animDef.onComplete) s.animDef.onComplete(s.target);
      }
    }

    for (var r = 0; r < toRemove.length; r++) {
      delete this.playing[toRemove[r]];
    }
  },

  // Bir modelin tum animasyon pivotlarini sifirla (identity rotation)
  resetPose(target, modelPlugin) {
    if (!target || !modelPlugin || !modelPlugin.animations) return;
    var pivots = {};
    for (var key in modelPlugin.animations) {
      var tracks = modelPlugin.animations[key].tracks;
      if (!tracks) continue;
      for (var i = 0; i < tracks.length; i++) {
        pivots[tracks[i].pivot] = true;
      }
    }
    for (var name in pivots) {
      var p = this._findPivot(target, name);
      if (p) p.rotation.set(0, 0, 0);
    }
  },

  // Belirli bir animasyonu durdur
  stop(id) {
    if (id && this.playing[id]) {
      delete this.playing[id];
    }
  },

  // Tum animasyonlari durdur
  stopAll(target) {
    var toRemove = [];
    for (var id in this.playing) {
      var s = this.playing[id];
      if (!target || s.target === target) {
        toRemove.push(id);
      }
    }
    for (var r = 0; r < toRemove.length; r++) {
      delete this.playing[toRemove[r]];
    }
  },

  destroy() {
    this.playing = {};
  },

  _findPivot(group, name) {
    if (name === '__self__') return group;
    function search(obj) {
      if (obj.name === name) return obj;
      if (obj.children) {
        for (var i = 0; i < obj.children.length; i++) {
          var found = search(obj.children[i]);
          if (found) return found;
        }
      }
      return null;
    }
    return search(group);
  }
});
