var plugin = include('registry');

plugin.register({
  id: 'ui_dropbox_loot',
  name: 'Drop Kutusu Bildirimi',
  type: 'ui',
  version: '1.0',
  description: 'Drop kutusundan çıkan eşyayı gösteren bildirim',
  priority: 50,

  init() {
    var self = this;
    this._el = null;
    this._hideTimer = null;

    plugin.on('dropbox:loot', this.id, function(data) {
      self._show(data);
    });
  },

  _createEl() {
    if (this._el) return;
    var el = document.createElement('div');
    el.id = 'dropboxLoot';
    el.style.cssText = 'position:fixed;left:50%;top:55%;transform:translate(-50%,-50%) translateY(20px);z-index:180;opacity:0;transition:opacity .3s ease,transform .3s ease;pointer-events:none;display:none;';
    el.innerHTML =
      '<div style="display:flex;align-items:center;gap:14px;background:rgba(0,0,0,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,215,0,.22);border-radius:10px;padding:10px 16px;width:320px;box-shadow:0 8px 32px rgba(0,0,0,.5);">' +
        '<div id="dlThumb" style="width:56px;height:56px;border-radius:8px;background:rgba(255,255,255,.04);flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;"><div style="color:rgba(255,255,255,.12);font-size:9px;letter-spacing:1px;">—</div></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div id="dlName" style="color:#fff;font-size:14px;font-weight:600;letter-spacing:.3px;text-shadow:0 1px 4px rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>' +
          '<div id="dlDesc" style="color:rgba(255,255,255,.35);font-size:11px;margin-top:2px;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    this._el = el;
  },

  _show(data) {
    this._createEl();
    var el = this._el;
    if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }

    document.getElementById('dlName').textContent = data.name || '???';
    var desc = data.type === 'ammo' ? '+' + (data.amount || '') + ' cephane' : (data.description || '');
    document.getElementById('dlDesc').textContent = desc;

    this._renderThumb(data.modelId, function(url) {
      var thumb = document.getElementById('dlThumb');
      if (thumb && url) {
        thumb.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;display:block;">';
      }
    });

    el.style.display = 'block';
    requestAnimationFrame(function() {
      el.style.opacity = '1';
      el.style.transform = 'translate(-50%,-50%) translateY(0)';
    });

    var self = this;
    this._hideTimer = setTimeout(function() {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%,-50%) translateY(20px)';
      self._hideTimer = setTimeout(function() {
        if (el) el.style.display = 'none';
        self._hideTimer = null;
      }, 350);
    }, 2000);
  },

  _renderThumb(modelId, callback) {
    if (!modelId) { callback(null); return; }
    var modelP = plugin.get(modelId);
    if (!modelP || !modelP.enabled || typeof modelP.createModel !== 'function') {
      callback(null);
      return;
    }

    var mesh;
    try { mesh = modelP.createModel(); } catch (e) { callback(null); return; }
    if (!mesh) { callback(null); return; }

    var size = 56;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      renderer.setSize(size, size);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);
    } catch (e) { callback(null); return; }

    var scene = new THREE.Scene();
    scene.background = null;
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(3, 5, 4);
    scene.add(dl);

    var camPos = modelP.thumbnailCam || [1.8, 1.0, 1.8];
    var offset = modelP.thumbnailOffset || [0, 0, 0];

    var box = new THREE.Box3().setFromObject(mesh);
    var s = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(s.x, s.y, s.z);
    if (maxDim > 0) {
      var scale = 1.5 / maxDim;
      mesh.scale.set(scale, scale, scale);
    }
    var center = box.getCenter(new THREE.Vector3());
    mesh.position.sub(center);
    mesh.position.set(offset[0] || 0, offset[1] || 0, offset[2] || 0);

    var cam = new THREE.PerspectiveCamera(25, 1, 0.1, 20);
    cam.position.set(camPos[0], camPos[1], camPos[2]);
    cam.lookAt(0, 0, 0);

    scene.add(mesh);
    renderer.render(scene, cam);
    scene.remove(mesh);

    mesh.traverse(function(child) {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(function(m) { m.dispose(); });
          else child.material.dispose();
        }
      }
    });

    var url = renderer.domElement.toDataURL();
    renderer.dispose();
    callback(url);
  },

  destroy() {
    if (this._el) this._el.remove();
    if (this._hideTimer) { clearTimeout(this._hideTimer); this._hideTimer = null; }
    plugin.off('dropbox:loot', this.id);
  }
});
