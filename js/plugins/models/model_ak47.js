var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'model_ak47',
  name: 'AK-47 Model',
  type: 'model',
  version: '1.4',
  description: 'AK-47 viewmodel from .mdl + native animations',
  enabled: true,
  forceEnabled: true,

  _mdlFile: null,
  _ready: false,
  _pendingCb: null,

  init() {
    var self = this;
    loader.loadScript('model_mdl', function() {
      var mdl = plugin.get('model_mdl');
      if (!mdl) return;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'assets/models/v_ak47.mdl', true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        if (xhr.status !== 200 && xhr.status !== 0) { console.error('[model_ak47] HTTP', xhr.status); return; }
        try {
          self._mdlFile = mdl.parse(xhr.response);
          self._ready = true;
          if (self._pendingCb) { self._pendingCb(); self._pendingCb = null; }
        } catch(e) { console.error('[model_ak47] parse error', e); }
      };
      xhr.onerror = function() { console.error('[model_ak47] network error'); };
      xhr.send();
    });
  },

  createModel() {
    if (this._ready && this._mdlFile) {
      return this._build();
    }
    var self = this;
    this._pendingCb = function() {
      var fp = plugin.get('fx_firstperson');
      if (!fp || !fp._viewGroup || !fp._arms) return;
      var slot = fp._arms.slot;
      if (!slot) return;
      var old = slot.getObjectByName('ak47_model');
      if (old) slot.remove(old);
      var wp = plugin.get('weapon_ak47');
      if (wp && wp._onModelReady) wp._onModelReady();
    };
    return new THREE.Group();
  },

  _build: function() {
    var mdl = plugin.get('model_mdl');
    if (!mdl) return new THREE.Group();
    var r = mdl.build(this._mdlFile);
    var g = r.group;
    g.name = 'ak47_model';
    g.scale.set(0.08, 0.08, 0.08);
    g.position.set(0.35, -0.30, -0.18);
    g.rotation.set(-0.06, 3.1, 0.03);

    var mixer = new THREE.AnimationMixer(g);
    var clips = {};
    for (var i = 0; i < r.animations.length; i++) {
      var c = r.animations[i];
      clips[c.name] = c;
    }
    g.userData.mixer = mixer;
    g.userData.clips = clips;
    return g;
  }
});
