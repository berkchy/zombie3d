var plugin = window.include('registry');
var cvar = window.include('cvar');
var commands = window.include('commands');

plugin.register({
  id: 'camera_thirdperson',
  name: 'Üçüncü Şahıs Kamerası',
  type: 'player',
  version: '1.0',
  description: 'Third person kamerasi — oyuncunun arkasindan takip',
  priority: 90,
  enabled: true,

  yaw: 0,
  pitch: 0,
  locked: false,
  _raycaster: null,
  _touchId: null,
  _touchLast: null,

  init(game) {
    this.game = game;
    this._raycaster = new THREE.Raycaster();

    cvar.register('camera_mode', 'firstperson', 'string', 'Kamera modu (firstperson / thirdperson)');
    cvar.register('camera_thirdperson_distance', 4, 'number', 'TP kamera mesafesi (1-15)');
    cvar.register('camera_thirdperson_height', 1.8, 'number', 'TP kamera yuksekligi (0-5)');
    cvar.register('camera_thirdperson_smooth', 0.08, 'number', 'TP kameranin yumusaklik katsayisi (0.01-0.3)');
    cvar.register('camera_thirdperson_fov', 60, 'number', 'TP kamerasi FOV (40-120)');
    cvar.register('camera_thirdperson_collision', true, 'boolean', 'TP kameranin duvarlarla carpisma kontrolu');

    game.cameraMode = cvar.get('camera_mode') || 'firstperson';

    var self = this;

    this._onMove = function(e) {
      if (!this.locked) return;
      var mult = this._readMult();
      this.yaw -= (e.movementX || 0) * 0.002 * mult;
      this.pitch += (e.movementY || 0) * 0.002 * mult;
      this._clampPitch();
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
          this.yaw -= dx * 0.004 * mult;
          this.pitch += dy * 0.004 * mult;
          this._clampPitch();
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

    cvar.onChange('camera_mode', function(val) {
      game.cameraMode = val;
    });

    commands.register('camera_thirdperson', 'thirdperson', function(args) {
      game.cameraMode = 'thirdperson';
      cvar.set('camera_mode', 'thirdperson');
      return 'Third person kameraya gecildi';
    }, 'Ucuncu sahis kamerasi');

    commands.register('camera_thirdperson', 'firstperson', function(args) {
      game.cameraMode = 'firstperson';
      cvar.set('camera_mode', 'firstperson');
      return 'First person kameraya gecildi';
    }, 'Birinci sahis kamerasi');
  },

  _readMult: function() {
    try { return cvar.get('sensitivity') || 1; } catch(e) { return 1; }
  },

  _clampPitch() {
    this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch));
  },

  update(dt) {
    if (!this.game || this.game._dying) return;
    if (this.game.cameraMode !== 'thirdperson') return;

    this.game.fpYaw = this.yaw;
    this.game.fpPitch = this.pitch;

    var mesh = this.game.playerMesh;
    if (!mesh) return;

    var dist = +cvar.get('camera_thirdperson_distance') || 4;
    var height = +cvar.get('camera_thirdperson_height') || 1.8;
    var smooth = +cvar.get('camera_thirdperson_smooth') || 0.08;
    var collision = cvar.get('camera_thirdperson_collision') !== false;

    mesh.rotation.y = this.yaw + Math.PI;

    var cam = this.game.camera;
    if (!cam) {
      cam = window.camera;
      if (!cam) return;
    }

    var targetX = mesh.position.x + dist * Math.sin(this.yaw) * Math.cos(this.pitch);
    var targetY = mesh.position.y + height + dist * Math.sin(this.pitch);
    var targetZ = mesh.position.z + dist * Math.cos(this.yaw) * Math.cos(this.pitch);

    if (collision && this.game.scene) {
      this._raycaster.set(
        new THREE.Vector3(mesh.position.x, mesh.position.y + height, mesh.position.z),
        new THREE.Vector3(targetX - mesh.position.x, targetY - (mesh.position.y + height), targetZ - mesh.position.z).normalize()
      );
      var mapPluginId = this.game.currentMap ? 'map_' + this.game.currentMap.id : null;
      var mapPlugin = mapPluginId ? plugin.get(mapPluginId) : null;
      var meshes = mapPlugin ? MeshCollider.collectMapMeshes(mapPlugin) : [];
      var intersects = this._raycaster.intersectObjects(meshes, true);
      if (intersects.length > 0 && intersects[0].distance < dist) {
        var ratio = intersects[0].distance / dist;
        targetX = mesh.position.x + (targetX - mesh.position.x) * ratio * 0.9;
        targetY = mesh.position.y + height + (targetY - (mesh.position.y + height)) * ratio * 0.9;
        targetZ = mesh.position.z + (targetZ - mesh.position.z) * ratio * 0.9;
      }
    }

    cam.position.x += (targetX - cam.position.x) * smooth;
    cam.position.y += (targetY - cam.position.y) * smooth;
    cam.position.z += (targetZ - cam.position.z) * smooth;

    cam.lookAt(mesh.position.x, mesh.position.y + 0.6, mesh.position.z);

    var fov = +cvar.get('camera_thirdperson_fov') || 60;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
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
    commands.unregisterAll('camera_thirdperson');
  }
});
