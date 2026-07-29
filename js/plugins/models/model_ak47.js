var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'model_ak47',
  name: 'AK-47 Model',
  type: 'model',
  version: '1.3',
  description: 'AK-47 viewmodel from .mdl + native animations',
  enabled: true,
  forceEnabled: true,

  _mdlFile: null,
  _ready: false,

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
          var clipNames = [];
          self._mdlFile.sequences.forEach(function(s) { clipNames.push(s.label); });
          console.log('[model_ak47] loaded, clips:', clipNames.join(', '));
        } catch(e) { console.error('[model_ak47] parse error', e); }
      };
      xhr.onerror = function() { console.error('[model_ak47] network error'); };
      xhr.send();
    });
  },

  createModel() {
    if (!this._ready || !this._mdlFile) return new THREE.Group();
    var mdl = plugin.get('model_mdl');
    if (!mdl) return new THREE.Group();
    var r = mdl.build(this._mdlFile);
    var g = r.group;
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
