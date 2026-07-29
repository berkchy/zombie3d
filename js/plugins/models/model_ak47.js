var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'model_ak47',
  name: 'AK-47 Model',
  type: 'model',
  version: '1.5',
  description: 'AK-47 viewmodel from .mdl + native animations',
  enabled: true,
  forceEnabled: true,

  _mdlFile: null,
  _ready: false,
  _pendingCb: null,

  init() {
    console.log('[model_ak47] init');
    var self = this;
    loader.loadScript('model_mdl', function() {
      console.log('[model_ak47] model_mdl loaded, starting XHR');
      var mdl = plugin.get('model_mdl');
      if (!mdl) { console.log('[model_ak47] mdl plugin not found'); return; }
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'assets/models/v_ak47.mdl', true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        if (xhr.status !== 200 && xhr.status !== 0) { console.error('[model_ak47] HTTP', xhr.status); return; }
        try {
          self._mdlFile = mdl.parse(xhr.response);
          self._ready = true;
          console.log('[model_ak47] parse OK, ready=true');
          if (self._pendingCb) { self._pendingCb(); self._pendingCb = null; }
        } catch(e) { console.error('[model_ak47] parse error', e); }
      };
      xhr.onerror = function() { console.error('[model_ak47] network error'); };
      xhr.send();
    });
  },

  createModel() {
    console.log('[model_ak47] createModel called, _ready=' + this._ready);
    if (this._ready && this._mdlFile) {
      console.log('[model_ak47] building from .mdl');
      return this._build();
    }
    console.log('[model_ak47] not ready, returning test cube');
    var self = this;
    this._pendingCb = function() {
      console.log('[model_ak47] _pendingCb fired');
      var fp = plugin.get('fx_firstperson');
      if (!fp || !fp._viewGroup || !fp._arms) { console.log('[model_ak47] _pendingCb: fp not ready'); return; }
      var slot = fp._arms.slot;
      if (!slot) { console.log('[model_ak47] _pendingCb: no slot'); return; }
      var old = slot.getObjectByName('ak47_model');
      if (old) slot.remove(old);
      var wp = plugin.get('weapon_ak47');
      if (wp && wp._onModelReady) { console.log('[model_ak47] calling _onModelReady'); wp._onModelReady(); }
      else console.log('[model_ak47] wp or _onModelReady missing');
    };
    var cube = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({color: 0xff0000}));
    cube.name = 'ak47_model';
    return cube;
  },

  _build: function() {
    console.log('[model_ak47] _build starting');
    var mdl = plugin.get('model_mdl');
    if (!mdl) return new THREE.Group();
    var r = mdl.build(this._mdlFile);
    var g = r.group;
    g.name = 'ak47_model';

    var mixer = new THREE.AnimationMixer(g);
    var clips = {};
    for (var i = 0; i < r.animations.length; i++) {
      var c = r.animations[i];
      clips[c.name] = c;
    }
    g.userData.mixer = mixer;
    g.userData.clips = clips;
    console.log('[model_ak47] _build done, meshes:', g.getObjectsByProperty('isMesh', true).length);
    return g;
  }
});
