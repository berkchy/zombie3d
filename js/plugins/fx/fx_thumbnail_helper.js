var plugin = include('registry');

plugin.register({
  id: 'fx_thumbnail_helper',
  name: 'Thumbnail Yardımcısı',
  type: 'fx',
  version: '1.0',
  description: '3D modellerden thumbnail üretir, dropbox/hotbar/ui_model_test kullanır',

  _renderer: null,
  _scene: null,
  _cam: null,

  init() {
    this._ensureRenderer();
  },

  _ensureRenderer() {
    if (this._renderer) return true;
    try {
      this._renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      this._scene = new THREE.Scene();
      this._scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      var dl = new THREE.DirectionalLight(0xffffff, 0.9);
      dl.position.set(3, 5, 4);
      this._scene.add(dl);
      this._cam = new THREE.PerspectiveCamera(25, 1, 0.1, 20);
      return true;
    } catch (e) { return false; }
  },

  getThumbnail(modelId, size) {
    if (!this._ensureRenderer()) return null;
    size = size || 80;
    var mp = plugin.get(modelId);
    if (!mp || !mp.enabled || typeof mp.createModel !== 'function') return null;
    try {
      var mesh = mp.createModel();
      if (!mesh) return null;

      this._renderer.setSize(size, size);
      this._renderer.setPixelRatio(1);
      this._renderer.setClearColor(0x000000, 0);

      var box = new THREE.Box3().setFromObject(mesh);
      var s = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(s.x, s.y, s.z);
      if (maxDim > 0) mesh.scale.setScalar(1.5 / maxDim);
      var center = box.getCenter(new THREE.Vector3());
      mesh.position.sub(center);
      var off = mp.thumbnailOffset || [0, 0, 0];
      mesh.position.x += off[0] || 0;
      mesh.position.y += off[1] || 0;
      mesh.position.z += off[2] || 0;

      var camPos = mp.thumbnailCam || [1.8, 1.0, 1.8];
      this._cam.position.set(camPos[0], camPos[1], camPos[2]);
      this._cam.lookAt(0, 0, 0);

      this._scene.add(mesh);
      this._renderer.render(this._scene, this._cam);
      this._scene.remove(mesh);

      var url = this._renderer.domElement.toDataURL();

      mesh.traverse(function(ch) {
        if (ch.isMesh) {
          if (ch.geometry) ch.geometry.dispose();
          if (ch.material) {
            if (Array.isArray(ch.material)) ch.material.forEach(function(x) { x.dispose(); });
            else ch.material.dispose();
          }
        }
      });

      return url;
    } catch (e) { return null; }
  },

  destroy() {
    if (this._renderer) {
      this._renderer.dispose();
      this._renderer = null;
      this._scene = null;
      this._cam = null;
    }
  }
});
