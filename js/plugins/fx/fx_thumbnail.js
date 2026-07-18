var plugin = include('registry');

plugin.register({
  id: 'fx_thumbnail',
  name: 'Thumbnail Olusturucu',
  type: 'core',
  version: '1.0',
  description: 'Model thumbnail ini offscreen render eder — her model kendi kamera ayarini belirler',
  priority: -50,

  _renderer: null,
  _scene: null,
  _camera: null,
  _cache: null,

  init() {
    this._cache = {};
  },

  getThumbnail(weaponId, modelId, size) {
    size = size || 72;
    var key = weaponId + '_' + size;
    if (this._cache[key]) return this._cache[key];

    var modelP = plugin.get(modelId);
    if (!modelP || !modelP.enabled || typeof modelP.createModel !== 'function') return null;

    var mesh;
    try { mesh = modelP.createModel(); } catch (e) { return null; }
    if (!mesh) return null;

    if (!this._renderer) {
      var canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      this._renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      this._renderer.setSize(size, size);
      this._renderer.setPixelRatio(1);
      this._renderer.setClearColor(0x000000, 0);

      this._scene = new THREE.Scene();
      this._scene.background = null;
      this._scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      var dl = new THREE.DirectionalLight(0xffffff, 0.9);
      dl.position.set(3, 5, 4);
      this._scene.add(dl);
      var bl = new THREE.DirectionalLight(0x8888ff, 0.3);
      bl.position.set(-2, 3, -3);
      this._scene.add(bl);

      this._camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
    }

    // Modeli bounding box'a gore ortala ve olceklendir
    var box = new THREE.Box3().setFromObject(mesh);
    var size3 = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(size3.x, size3.y, size3.z);
    if (maxDim > 0) {
      var scale = 1.2 / maxDim;
      mesh.scale.set(scale, scale, scale);
    }
    var center = box.getCenter(new THREE.Vector3());
    mesh.position.sub(center);

    // Model'in thumbnail pozisyon ofseti varsa uygula
    if (modelP.thumbnailOffset) {
      mesh.position.x += modelP.thumbnailOffset[0] || 0;
      mesh.position.y += modelP.thumbnailOffset[1] || 0;
      mesh.position.z += modelP.thumbnailOffset[2] || 0;
    }

    // Model'in thumbnail kamerasi varsa kullan, yoksa varsayilan
    var camPos = [1.5, 0.8, 1.5];
    if (modelP.thumbnailCam) {
      camPos = modelP.thumbnailCam;
    }
    this._camera.position.set(camPos[0], camPos[1], camPos[2]);
    this._camera.lookAt(0, 0, 0);

    this._scene.add(mesh);
    this._renderer.render(this._scene, this._camera);
    this._scene.remove(mesh);

    mesh.traverse(function(child) {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(function(m) { m.dispose(); });
          else child.material.dispose();
        }
      }
    });

    var dataUrl = this._renderer.domElement.toDataURL();
    this._cache[key] = dataUrl;
    return dataUrl;
  },

  clearCache() {
    this._cache = {};
  },

  destroy() {
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer = null;
      this._scene = null;
      this._camera = null;
    }
    this._cache = null;
  }
});
