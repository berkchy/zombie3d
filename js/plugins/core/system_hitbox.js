var plugin = include('registry');
var commands = include('commands');

var _models = [];

plugin.register({
  id: 'system_hitbox',
  name: 'Hitbox Sistemi',
  type: 'core',
  version: '1.0',
  description: 'Model hitbox yönetimi — hedef tespiti, görselleştirme, çarpan hesabı',

  init() {
    _models = [];
    var self = this;

    if (commands) {
      commands.register('system_hitbox', 'hitbox', function(args) {
        if (args.length === 0) return 'Kullanım: hitbox show / hitbox hide / hitbox toggle';

        var sub = args[0];
        if (sub === 'show') { self.showAll(); return 'Hitboxlar gösteriliyor'; }
        if (sub === 'hide') { self.hideAll(); return 'Hitboxlar gizleniyor'; }
        if (sub === 'toggle') {
          var vis = self._visible;
          if (vis === undefined || vis === null) vis = false;
          if (vis) { self.hideAll(); return 'Hitboxlar gizleniyor'; }
          else { self.showAll(); return 'Hitboxlar gösteriliyor'; }
        }
        return 'Kullanım: hitbox show / hitbox hide / hitbox toggle';
      });
    }
  },

  hitboxMultipliers: {
    head: 3.0,
    chest: 1.0,
    arm: 0.6,
    leg: 0.5,
    foot: 0.3
  },

  maxDamageDist: 50,
  minDamageDist: 5,
  _visible: false,

  createHitboxes(model, defs) {
    if (!model || !defs) return [];
    var boxes = [];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var pivot = this._findPivot(model, d.pivot);
      if (!pivot) continue;

      var geo = new THREE.BoxGeometry(d.size[0], d.size[1], d.size[2]);
      var mat = new THREE.MeshBasicMaterial({
        color: this._colorForType(d.type),
        wireframe: true,
        transparent: true,
        opacity: 0.7,
        depthTest: false,
        depthWrite: false
      });
      var mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.pos[0], d.pos[1], d.pos[2]);
      mesh.renderOrder = 999;
      mesh.userData.hitType = d.type;
      mesh.userData.hitbox = true;
      mesh.visible = this._visible;
      pivot.add(mesh);
      boxes.push(mesh);
    }
    if (!model.userData) model.userData = {};
    model.userData.hitboxes = boxes;
    if (_models.indexOf(model) === -1) _models.push(model);
    return boxes;
  },

  removeHitboxes(model) {
    if (!model || !model.userData || !model.userData.hitboxes) return;
    for (var i = 0; i < model.userData.hitboxes.length; i++) {
      var hb = model.userData.hitboxes[i];
      if (hb.parent) hb.parent.remove(hb);
      if (hb.geometry) hb.geometry.dispose();
      if (hb.material) hb.material.dispose();
    }
    model.userData.hitboxes = [];
    var idx = _models.indexOf(model);
    if (idx !== -1) _models.splice(idx, 1);
  },

  showHitboxes(model) {
    if (!model || !model.userData || !model.userData.hitboxes) return;
    for (var i = 0; i < model.userData.hitboxes.length; i++) {
      model.userData.hitboxes[i].visible = true;
    }
  },

  hideHitboxes(model) {
    if (!model || !model.userData || !model.userData.hitboxes) return;
    for (var i = 0; i < model.userData.hitboxes.length; i++) {
      model.userData.hitboxes[i].visible = false;
    }
  },

  showAll() {
    this._visible = true;
    for (var i = 0; i < _models.length; i++) {
      this.showHitboxes(_models[i]);
    }
  },

  hideAll() {
    this._visible = false;
    for (var i = 0; i < _models.length; i++) {
      this.hideHitboxes(_models[i]);
    }
  },

  getModels() { return _models; },

  getHitTypeAtPoint(model, point) {
    if (!model || !model.userData || !model.userData.hitboxes) return null;
    var boxes = model.userData.hitboxes;
    var local = new THREE.Vector3();
    for (var i = 0; i < boxes.length; i++) {
      var hb = boxes[i];
      hb.worldToLocal(local.copy(point));
      var hs = hb.geometry.parameters;
      var hw = hs.width / 2;
      var hh = hs.height / 2;
      var hd = hs.depth / 2;
      if (Math.abs(local.x) <= hw && Math.abs(local.y) <= hh && Math.abs(local.z) <= hd) {
        return hb.userData.hitType;
      }
    }
    return null;
  },

  calcDamage(baseDmg, hitType, dist) {
    var mult = this.hitboxMultipliers[hitType] || 1.0;
    var distFactor = 1 - Math.min(1, Math.max(0, (dist - this.minDamageDist) / (this.maxDamageDist - this.minDamageDist))) * 0.5;
    return Math.round(baseDmg * mult * distFactor);
  },

  getHeadWorldPos(mesh) {
    if (!mesh || !mesh.userData || !mesh.userData.hitboxes) return null;
    var boxes = mesh.userData.hitboxes;
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].userData.hitType === 'head') {
        var pos = new THREE.Vector3();
        boxes[i].getWorldPosition(pos);
        return pos;
      }
    }
    return null;
  },

  _colorForType(type) {
    switch (type) {
      case 'head': return 0xff4444;
      case 'chest': return 0x4488ff;
      case 'arm': return 0x44ff44;
      case 'leg': return 0xffaa44;
      case 'foot': return 0xff66aa;
      default: return 0xffffff;
    }
  },

  _findPivot(obj, name) {
    if (obj.name === name) return obj;
    function search(child) {
      if (child.name === name) return child;
      for (var i = 0; i < child.children.length; i++) {
        var found = search(child.children[i]);
        if (found) return found;
      }
      return null;
    }
    return search(obj);
  },

  destroy() {
    _models = [];
  }
});
