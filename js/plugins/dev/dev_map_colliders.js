var plugin = include('registry');
var commands = include('commands');

plugin.register({
  id: 'dev_map_colliders',
  name: 'Mesh Collision Goruntuleyici',
  type: 'core',
  version: '2.0',
  description: 'Mesh tabanli collision geometrisini wireframe olarak gosterir',
  priority: 99,

  _helpers: [],
  _visible: false,

  init() {
    this._helpers = [];
    this._visible = false;
    var self = this;

    if (commands) {
      commands.register('dev_map_colliders', 'colliders', function(args) {
        if (args.length === 0) return 'Kullanim: colliders show / colliders hide / colliders toggle';

        var sub = args[0];
        if (sub === 'show') { self.show(); return 'Collision mesh wireframe gosteriliyor'; }
        if (sub === 'hide') { self.hide(); return 'Collision mesh wireframe gizleniyor'; }
        if (sub === 'toggle') {
          if (self._visible) { self.hide(); return 'Collision mesh wireframe gizleniyor'; }
          else { self.show(); return 'Collision mesh wireframe gosteriliyor'; }
        }
        return 'Kullanim: colliders show / colliders hide / colliders toggle';
      });
    }
  },

  show() {
    this.hide();
    if (!game || !game.currentMap || !game.scene) return;
    game.scene.updateMatrixWorld(true);

    var mapPluginId = 'map_' + game.currentMap.id;
    var map = plugin.get(mapPluginId);
    var meshes = map ? MeshCollider.collectMapMeshes(map) : null;
    if (!meshes || meshes.length === 0) return;

    this._visible = true;
    var tmpV = new THREE.Vector3();
    var tmpQ = new THREE.Quaternion();

    for (var i = 0; i < meshes.length; i++) {
      var m = meshes[i];
      var geo = m.geometry;
      if (!geo) continue;

      var edgeGeo = new THREE.EdgesGeometry(geo);
      var color = 0x44ff44;
      if (m.userData.walkable === false) color = 0xffff44;
      if (m.material && m.material.color) {
        var c = m.material.color;
        color = (Math.round(c.r * 255) << 16) | (Math.round(c.g * 255) << 8) | Math.round(c.b * 255);
      }
      var edgeMat = new THREE.LineBasicMaterial({ color: color });
      var wire = new THREE.LineSegments(edgeGeo, edgeMat);
      m.getWorldPosition(tmpV);
      m.getWorldQuaternion(tmpQ);
      wire.position.copy(tmpV);
      wire.quaternion.copy(tmpQ);
      wire.scale.copy(m.scale);
      game.scene.add(wire);
      this._helpers.push(wire);
    }
  },

  hide() {
    if (!game || !game.scene) return;
    for (var i = 0; i < this._helpers.length; i++) {
      game.scene.remove(this._helpers[i]);
      if (this._helpers[i].geometry) this._helpers[i].geometry.dispose();
      if (this._helpers[i].material) this._helpers[i].material.dispose();
    }
    this._helpers = [];
    this._visible = false;
  },

  destroy() {
    this.hide();
    if (commands) commands.unregisterAll('dev_map_colliders');
  }
});
