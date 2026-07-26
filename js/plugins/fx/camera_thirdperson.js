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

  _raycaster: null,

  init(game) {
    this.game = game;
    this._raycaster = new THREE.Raycaster();

    cvar.register('camera_mode', 'firstperson', 'string', 'Kamera modu (firstperson / thirdperson)');
    cvar.register('camera_thirdperson_distance', 4, 'number', 'TP kamera mesafesi (1-15)');
    cvar.register('camera_thirdperson_height', 1.8, 'number', 'TP kamera yuksekligi (0-5)');
    cvar.register('camera_thirdperson_pitch', -0.3, 'number', 'TP kameranin dikey acisi (-1.5 - 1.5)');
    cvar.register('camera_thirdperson_smooth', 0.08, 'number', 'TP kameranin yumusaklik katsayisi (0.01-0.3)');
    cvar.register('camera_thirdperson_fov', 60, 'number', 'TP kamerasi FOV (40-120)');
    cvar.register('camera_thirdperson_collision', true, 'boolean', 'TP kameranin duvarlarla carpisma kontrolu');

    game.cameraMode = cvar.get('camera_mode') || 'firstperson';

    var self = this;

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

  update(dt) {
    if (!this.game || this.game._dying) return;
    if (this.game.cameraMode !== 'thirdperson') return;

    var mesh = this.game.playerMesh;
    if (!mesh) return;

    var dist = +cvar.get('camera_thirdperson_distance') || 4;
    var height = +cvar.get('camera_thirdperson_height') || 1.8;
    var smooth = +cvar.get('camera_thirdperson_smooth') || 0.08;
    var pitchOffset = +cvar.get('camera_thirdperson_pitch') || -0.3;
    var collision = cvar.get('camera_thirdperson_collision') !== false;

    var yaw = this.game.fpYaw || 0;
    var pitch = this.game.fpPitch || 0;
    var effectivePitch = pitch + pitchOffset;
    mesh.rotation.y = yaw + Math.PI;

    var cam = this.game.camera;
    if (!cam) {
      cam = window.camera;
      if (!cam) return;
    }

    var targetX = mesh.position.x + dist * Math.sin(yaw) * Math.cos(effectivePitch);
    var targetY = mesh.position.y + height + dist * Math.sin(effectivePitch);
    var targetZ = mesh.position.z + dist * Math.cos(yaw) * Math.cos(effectivePitch);

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
    commands.unregisterAll('camera_thirdperson');
  }
});
