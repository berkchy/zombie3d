var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'model_ak47',
  name: 'AK-47 Model',
  type: 'model',
  version: '1.6',
  description: 'AK-47 viewmodel from .mdl + native animations',
  enabled: true,
  forceEnabled: true,

  _mdlFile: null,
  _ready: false,
  _cachedGroup: null,

  init() {
    var self = this;
    loader.loadScript('model_mdl', function() {
      var mdl = plugin.get('model_mdl');
      if (!mdl) { console.error('[model_ak47] mdl plugin not found'); return; }
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'assets/models/v_ak47.mdl', true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        if (xhr.status !== 200 && xhr.status !== 0) { console.error('[model_ak47] HTTP', xhr.status); return; }
        try {
          self._mdlFile = mdl.parse(xhr.response);
          self._ready = true;
          console.log('[model_ak47] parse OK, ready=true');
        } catch(e) { console.error('[model_ak47] parse error', e); }
      };
      xhr.onerror = function() { console.error('[model_ak47] network error'); };
      xhr.send();
    });
  },

  createModel() {
    if (this._cachedGroup) return this._cachedGroup;
    if (this._ready && this._mdlFile) {
      console.log('[model_ak47] building from .mdl');
      this._cachedGroup = this._build();
      return this._cachedGroup;
    }
    var cube = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    cube.name = 'ak47_model';
    return cube;
  },

  _build: function() {
    var mdl = plugin.get('model_mdl');
    if (!mdl) return new THREE.Group();
    var r = mdl.build(this._mdlFile);
    var g = r.group;
    g.name = 'ak47_model';

    g.traverse(function(n) {
      if (n.isMesh) {
        if (n.geometry) n.geometry.dispose = function(){};
        if (n.material) {
          if (Array.isArray(n.material)) n.material.forEach(function(m) { m.dispose = function(){}; });
          else n.material.dispose = function(){};
        }
      }
    });

    console.log('[model_ak47] _build done, meshes:', r.bones.length, 'animations:', r.animations.length);
    return g;
  }
});
