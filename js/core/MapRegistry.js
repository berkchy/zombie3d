var MapRegistry = {
  _maps: {},

  register: function(def) {
    if (!def.id) { console.warn('[MapRegistry] eksik id'); return; }
    this._maps[def.id] = def;
  },

  get: function(id) {
    return this._maps[id] || null;
  },

  getAll: function() {
    var a = [];
    for (var k in this._maps) a.push(this._maps[k]);
    return a;
  },

  getCount: function() {
    return Object.keys(this._maps).length;
  },

  _ensureRenderer: function(width, height) {
    if (this._thumbRenderer) {
      try {
        // Renderer hala gecerli mi kontrol et
        var testScene = new THREE.Scene();
        this._thumbRenderer.render(testScene, this._thumbCamera);
        return true;
      } catch (e) {
        // WebGL context lost — yeniden olustur
        this._thumbRenderer.dispose();
        this._thumbRenderer = null;
        this._thumbCanvas = null;
      }
    }
    var c = document.createElement('canvas');
    this._thumbCanvas = c;
    try {
      this._thumbRenderer = new THREE.WebGLRenderer({
        canvas: c, alpha: false, antialias: true, preserveDrawingBuffer: true
      });
      this._thumbCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      return true;
    } catch (e) {
      return false;
    }
  },

  renderThumbnail: function(mapId, width, height, callback) {
    var def = this._maps[mapId];
    if (!def) { callback(null); return; }
    if (def._thumbnail) { callback(def._thumbnail); return; }

    if (!this._ensureRenderer(width, height)) {
      callback(null);
      return;
    }

    var r = this._thumbRenderer;
    r.setSize(width, height, false);
    r.shadowMap.enabled = false;

    var cam = this._thumbCamera;
    cam.aspect = width / height;
    cam.updateProjectionMatrix();
    cam.position.set(def.thumbnailCamera.position[0], def.thumbnailCamera.position[1], def.thumbnailCamera.position[2]);
    cam.lookAt(def.thumbnailCamera.target[0], def.thumbnailCamera.target[1], def.thumbnailCamera.target[2]);

    var s = new THREE.Scene();
    s.background = new THREE.Color(0x1a1a2e);

    def.buildThumbnail(s, function() {
      try {
        r.render(s, cam);
        var url = MapRegistry._thumbCanvas.toDataURL('image/jpeg', 0.85);
        def._thumbnail = url;
        callback(url);
      } catch (e) {
        callback(null);
      }
      while (s.children.length) s.remove(s.children[0]);
    });
  }
};
