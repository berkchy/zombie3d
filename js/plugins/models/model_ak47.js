var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'model_ak47',
  name: 'AK-47 Model',
  type: 'model',
  version: '1.1',
  description: 'AK-47 viewmodel from .mdl + native animations',
  enabled: true,
  forceEnabled: true,

  _cachedResult: null,
  _ready: false,

  init() {
    var self = this;
    loader.loadScript('model_mdl', function() {
      var mdl = plugin.get('model_mdl');
      if (!mdl) return;
      mdl.loadAndBuild('assets/models/v_ak47.mdl', function(err, result) {
        if (err) { console.error('[model_ak47]', err); return; }
        self._cachedResult = result;
        self._ready = true;
        console.log('[model_ak47] loaded, clips:', result.animations.length);
      });
    });
  },

  createModel() {
    if (!this._ready || !this._cachedResult) return new THREE.Group();
    var r = this._cachedResult;
    var g = r.group.clone(true);
    g.scale.set(0.1, 0.1, 0.1);
    g.position.set(0.45, -0.22, -0.32);
    g.rotation.set(-0.08, 3.0, 0.05);

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
