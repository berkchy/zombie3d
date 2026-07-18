var plugin = window.include('registry');
var loader = window.include('loader');
var cvar = window.include('cvar');

plugin.register({
  id: 'fx_firstperson',
  name: 'Birinci Şahıs',
  type: 'core',
  version: '2.0',
  description: 'Birinci şahıs — view model (kollar model_viewmodel_arms eklentisinde)',
  enabled: true,
  priority: 90,

  game: null,
  yaw: 0,
  pitch: 0,
  sensMouse: 0.002,
  sensTouch: 0.004,
  locked: false,
  _touchId: null,
  _touchLast: null,
  _viewGroup: null,
  _viewWeapon: null,
  _arms: null,
  _overlayScene: null,
  _overlayCamera: null,


  _readMult: function() {
    var s = 1;
    try { s = cvar.get('sensitivity') || 1; } catch(e) {}
    return s;
  },

  _readInvert: function() {
    try { return cvar.get('invert_y') ? -1 : 1; } catch(e) { return 1; }
  },

  _poseForWeapon: function(type) {
    var map = { pistol: 'pistol', knife: 'knife', shotgun: 'default', smg: 'default', rifle: 'default', machinegun: 'default' };
    return map[type] || 'default';
  },

  _modelReady: false,

  init(game) {
    var self = this;
    this.game = game;
    game.fpYaw = 0;
    game.fpPitch = 0;
    this._modelReady = false;

    this._onMove = function(e) {
      if (!this.locked) return;
      var mult = this._readMult();
      var inv = this._readInvert();
      this.yaw -= (e.movementX || 0) * this.sensMouse * mult;
      this.pitch -= (e.movementY || 0) * this.sensMouse * mult * inv;
      this._clampPitch();
      game.fpYaw = this.yaw;
      game.fpPitch = this.pitch;
    }.bind(this);

    this._onClick = function() {
      if (!window.gameStarted || this.game.gameOverFlag) return;
      document.body.requestPointerLock();
    }.bind(this);

    this._onLock = function() {
      this.locked = document.pointerLockElement !== null;
    }.bind(this);

    document.addEventListener('mousemove', this._onMove);
    document.addEventListener('click', this._onClick);
    document.addEventListener('pointerlockchange', this._onLock);
    document.addEventListener('mozpointerlockchange', this._onLock);

    this._onTouchStart = function(e) {
      if (this._touchId !== null) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.clientX > window.innerWidth / 2) {
          this._touchId = t.identifier;
          this._touchLast = { x: t.clientX, y: t.clientY };
          break;
        }
      }
    }.bind(this);

    this._onTouchMove = function(e) {
      if (this._touchId === null) return;
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === this._touchId) {
          var dx = t.clientX - this._touchLast.x;
          var dy = t.clientY - this._touchLast.y;
          this._touchLast = { x: t.clientX, y: t.clientY };
          var mult = this._readMult();
          var inv = this._readInvert();
          this.yaw -= dx * this.sensTouch * mult;
          this.pitch -= dy * this.sensTouch * mult * inv;
          this._clampPitch();
          game.fpYaw = this.yaw;
          game.fpPitch = this.pitch;
          break;
        }
      }
    }.bind(this);

    this._onTouchEnd = function(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this._touchId) {
          this._touchId = null;
          this._touchLast = null;
          break;
        }
      }
    }.bind(this);

    document.addEventListener('touchstart', this._onTouchStart, { passive: true });
    document.addEventListener('touchmove', this._onTouchMove, { passive: true });
    document.addEventListener('touchend', this._onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', this._onTouchEnd, { passive: true });

    this._overlayScene = new THREE.Scene();
    this._overlayCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this._overlayScene.add(this._overlayCamera);

    // View model aydinlatmasi — haritadan bagimsiz sabit isik
    this._overlayScene.add(new THREE.AmbientLight(0x8888aa, 0.55));
    var dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(2, 3, 4);
    this._overlayScene.add(dl);
    var fl = new THREE.DirectionalLight(0x8888ff, 0.35);
    fl.position.set(-1, 1, -1);
    this._overlayScene.add(fl);

    loader.loadScript('model_viewmodel_arms', function() {
      self._onArmsReady();
    });

    plugin.on('hotbar:select', this.id, function(data) {
      self._updateViewWeapon(data.slot ? data.slot.id : null);
    });
  },

  _createViewModel: function() {
    var g = new THREE.Group();
    g.name = 'fp_viewmodel';
    g.visible = true;
    g.position.set(0.15, -0.12, -0.28);

    var armsPlugin = plugin.get('model_viewmodel_arms');
    if (armsPlugin && armsPlugin.enabled && armsPlugin.createArms) {
      this._arms = armsPlugin.createArms();
      g.add(this._arms.group);
    }

    // Arms plugin yoksa fallback bos slot
    if (!this._arms) {
      this._arms = { slot: new THREE.Object3D(), setPose: function(){} };
      this._arms.slot.name = 'fp_weapon_slot';
      g.add(this._arms.slot);
    }

    this._viewGroup = g;
    this._overlayCamera.add(g);
    this._applyOverlay();
  },

  _onArmsReady: function() {
    if (this._modelReady) return;
    this._modelReady = true;
    this._createViewModel();
  },

  _updateViewWeapon: function(weaponId) {
    var slot = this._arms ? this._arms.slot : null;
    if (!slot) return;

    while (slot.children.length > 0) {
      var child = slot.children[0];
      slot.remove(child);
      if (child.traverse) {
        child.traverse(function(n) {
          if (n.isMesh) {
            if (n.geometry) n.geometry.dispose();
            if (n.material) {
              if (Array.isArray(n.material)) n.material.forEach(function(m) { m.dispose(); });
              else n.material.dispose();
            }
          }
        });
      }
    }
    this._viewWeapon = null;

    if (!weaponId) return;

    var wp = plugin.get(weaponId);
    if (!wp || !wp.enabled || !wp.modelId) return;

    if (this._arms && this._arms.setPose) {
      this._arms.setPose(this._poseForWeapon(wp.weaponType));
    }

    var mp = plugin.get(wp.modelId);
    if (!mp || !mp.enabled || typeof mp.createModel !== 'function') return;

    var model;
    try { model = mp.createModel(); } catch(e) { return; }
    if (!model) return;

    model.scale.set(1.3, 1.3, 1.3);
    model.position.set(0, 0, 0);
    model.rotation.order = 'YXZ';

    if (wp.weaponType === 'knife') {
      // CS:GO tarzi — namlu capraz yukari/sola donuk
      model.rotation.set(-0.6, Math.PI, 0.25);
    } else {
      // Normal silahlar — hafif sag FOV acisi
      model.rotation.set(-0.1, Math.PI, 0.08);
    }

    slot.add(model);
    this._viewWeapon = model;
    this._applyOverlay();

    if (wp.setModelRef) wp.setModelRef(model);
    if (wp.setArmsRef && this._arms) wp.setArmsRef(this._arms.group);
  },

  _clampPitch() {
    this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
  },

  syncMainCamera: function(mainCam) {
    if (!this._overlayCamera) return;
    this._overlayCamera.position.copy(mainCam.position);
    this._overlayCamera.quaternion.copy(mainCam.quaternion);
    this._overlayCamera.fov = mainCam.fov;
    this._overlayCamera.aspect = mainCam.aspect;
    this._overlayCamera.near = mainCam.near;
    this._overlayCamera.far = mainCam.far;
    this._overlayCamera.updateProjectionMatrix();
  },

  _applyOverlay: function() {
    if (!this._viewGroup) return;
    this._viewGroup.traverse(function(n) {
      if (n.isMesh) {
        n.frustumCulled = false;
        n.material.depthTest = true;
        n.material.depthWrite = true;
      }
    });
  },

  destroy() {
    document.removeEventListener('mousemove', this._onMove);
    document.removeEventListener('click', this._onClick);
    document.removeEventListener('pointerlockchange', this._onLock);
    document.removeEventListener('mozpointerlockchange', this._onLock);
    document.removeEventListener('touchstart', this._onTouchStart);
    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);
    document.removeEventListener('touchcancel', this._onTouchEnd);
    plugin.off('hotbar:select', this.id);
    if (this._viewGroup && this._viewGroup.parent) {
      this._viewGroup.parent.remove(this._viewGroup);
    }
    this._overlayScene = null;
    this._overlayCamera = null;
  }
});
