var plugin = include('registry');

plugin.register({
  id: 'fx_menu_background',
  name: 'Menü Arkaplanı',
  type: 'scene',
  version: '1.0',
  description: 'Ana menüde yürüyen/idle zombiler',
  enabled: true,
  priority: -50,

  _zombies: null,
  _lights: [],
  _zombiesSpawned: false,

  init(game) {
    this.game = game;
    this._zombies = [];
    this._destroyed = false;
    this._skyboxHandled = false;
    this._zombiesSpawned = false;
    this._savedFov = this.game.camera.fov;

    this._fixFov();
    this._hidePlayer();
    this._setupCamera();
    this._setupScene();

    var self = this;
    this._resizeHandler = function() { self._fixFov(); };
    window.addEventListener('resize', this._resizeHandler);
    plugin.on('map:entered', this.id, function() { self.destroy(); });
    plugin.on('game:loaded', this.id, function() { self._spawnZombies(); });
    plugin.on('intro:done', this.id, function() {
      self._fixFov();
      self._hidePlayer();
      self._setupCamera();
      self._skyboxHandled = false;
    });
  },

  _fixFov() {
    var aspect = window.innerWidth / window.innerHeight;
    var targetHfov = typeof window._targetHfov !== 'undefined' ? window._targetHfov : 60;
    var vfov = 2 * Math.atan(Math.tan(targetHfov * Math.PI / 360) / aspect) * 180 / Math.PI;
    this.game.camera.fov = vfov;
    this.game.camera.updateProjectionMatrix();
  },

  _hidePlayer() {
    var pp = plugin.get('player_basic');
    if (pp && pp.mesh) { pp.mesh.visible = false; this._playerHidden = pp.mesh; }
  },

  _setupCamera() {
    this.game.camera.position.set(0, 0.8, 9);
    this.game.camera.lookAt(0, 0.2, 0);
  },

  _setupScene() {
    var scene = this.game.scene;

    var ambient = new THREE.AmbientLight(0x8080aa, 1.2);
    scene.add(ambient);
    this._lights.push(ambient);

    var hemi = new THREE.HemisphereLight(0x4466aa, 0x221111, 1.0);
    scene.add(hemi);
    this._lights.push(hemi);

    var dir = new THREE.DirectionalLight(0xffeedd, 1.5);
    dir.position.set(5, 12, 5);
    scene.add(dir);
    this._lights.push(dir);

    var fill = new THREE.DirectionalLight(0x8899cc, 0.6);
    fill.position.set(-3, 4, -2);
    scene.add(fill);
    this._lights.push(fill);
  },

  _spawnZombies() {
    if (this._zombiesSpawned || this._destroyed) return;
    this._zombiesSpawned = true;
    var modelPlugin = plugin.get('model_zombie');
    if (!modelPlugin || !modelPlugin.enabled || !modelPlugin.createModel) return;

    var count = 5;
    for (var i = 0; i < count; i++) {
      var mesh;
      try { mesh = modelPlugin.createModel(); } catch(e) { continue; }
      if (!mesh) continue;

      var x = (Math.random() - 0.5) * 6.0;
      var z = 2.0 + Math.random() * 4.0;

      mesh.position.set(x, 0, z);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.scale.set(1.5, 1.5, 1.5);

      this.game.scene.add(mesh);

      var anim = plugin.get('core_animation');
      var animId = null;
      if (anim && anim.enabled && modelPlugin.animations) {
        try { animId = anim.play(mesh, modelPlugin.animations.idle); } catch(e) {}
      }

      this._zombies.push({
        mesh: mesh,
        state: 'idle',
        animId: animId,
        target: null,
        idleTimer: 2 + Math.random() * 4,
        moveSpeed: 0.3 + Math.random() * 0.3,
        homeX: x,
        homeZ: z
      });
    }
  },

  _pickTarget(z) {
    var angle = Math.random() * Math.PI * 2;
    var radius = 0.3 + Math.random() * 0.6;
    z.target = {
      x: z.homeX + Math.cos(angle) * radius,
      z: z.homeZ + Math.sin(angle) * radius
    };
  },

  update(dt) {
    if (!this.game || !this._zombies || this._zombies.length === 0) return;

    if (!this._skyboxHandled) {
      this._skyboxHandled = true;
      var sky = this.game.scene.getObjectByName('skybox');
      if (sky) { sky.visible = false; this._skyboxHidden = sky; }
      var stars = this.game.scene.getObjectByName('stars');
      if (stars) { stars.visible = false; this._starsHidden = stars; }
    }

    var anim = plugin.get('core_animation');
    var modelPlugin = plugin.get('model_zombie');

    for (var i = 0; i < this._zombies.length; i++) {
      var z = this._zombies[i];

      if (z.state === 'idle') {
        z.idleTimer -= dt;
        if (z.idleTimer <= 0) {
          z.state = 'walk';
          if (anim && anim.enabled && modelPlugin && modelPlugin.animations && z.animId) {
            anim.stop(z.animId);
          }
          if (anim && anim.enabled && modelPlugin && modelPlugin.animations) {
            z.animId = anim.play(z.mesh, modelPlugin.animations.walk);
          }
          this._pickTarget(z);
        }
      } else if (z.state === 'walk') {
        if (!z.target) this._pickTarget(z);

        var dx = z.target.x - z.mesh.position.x;
        var dz = z.target.z - z.mesh.position.z;
        var dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.3) {
          z.state = 'idle';
          z.idleTimer = 3 + Math.random() * 5;
          if (anim && anim.enabled && modelPlugin && modelPlugin.animations && z.animId) {
            anim.stop(z.animId);
          }
          if (anim && anim.enabled && modelPlugin && modelPlugin.animations) {
            z.animId = anim.play(z.mesh, modelPlugin.animations.idle);
          }
        } else {
          var step = z.moveSpeed * dt;
          z.mesh.position.x += (dx / dist) * step;
          z.mesh.position.z += (dz / dist) * step;
          z.mesh.rotation.y = Math.atan2(dx, dz);
        }
      }
    }
  },

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    if (this._skyboxHidden) this._skyboxHidden.visible = true;
    if (this._starsHidden) this._starsHidden.visible = true;
    if (this._playerHidden) this._playerHidden.visible = true;

    var anim = plugin.get('core_animation');
    for (var i = 0; i < this._zombies.length; i++) {
      var z = this._zombies[i];
      if (z.animId && anim && anim.stop) anim.stop(z.animId);
      if (z.mesh && this.game && this.game.scene) this.game.scene.remove(z.mesh);
    }
    this._zombies = [];

    for (var i = 0; i < this._lights.length; i++) {
      if (this.game && this.game.scene) this.game.scene.remove(this._lights[i]);
    }
    this._lights = [];

    this.game.camera.position.set(0, 18, 12);
    this.game.camera.lookAt(0, 0, 0);
    this.game.camera.fov = this._savedFov;
    this.game.camera.updateProjectionMatrix();

    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    plugin.off('map:entered', this.id);
    plugin.off('game:loaded', this.id);
    plugin.off('intro:done', this.id);
  }
});
