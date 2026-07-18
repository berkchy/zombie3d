var plugin = include('registry');

plugin.register({
  id: 'fx_zombie_health',
  name: 'Zombi Can Bar',
  type: 'graphics',
  version: '1.0',
  description: '3D zombie health bars — stilize, zombie modeline gore konumlanir',
  priority: 25,

  game: null,
  _bars: {},

  init: function(game) {
    this.game = game;
    this._bars = {};
    var self = this;
    plugin.on('zombie:spawn', 'fx_zombie_health', function(data) {
      if (data && data.zombie) self._addBar(data.zombie);
    });
  },

  _addBar: function(zombie) {
    var id = zombie.mesh.uuid;
    if (this._bars[id]) return;

    var group = new THREE.Group();
    group.renderOrder = 999;

    var barW = 0.55;
    var barH = 0.09;
    var cr = 0.03;

    var shape = this._roundedRect(barW, barH, cr);

    var bgMat = new THREE.MeshBasicMaterial({
      color: 0x0a0a18, transparent: true, opacity: 0.85,
      side: THREE.DoubleSide, depthTest: false, depthWrite: false
    });
    var bg = new THREE.Mesh(new THREE.ShapeGeometry(shape), bgMat);
    bg.position.z = -0.005;
    group.add(bg);

    var glowMat = new THREE.MeshBasicMaterial({
      color: 0x3388ff, transparent: true, opacity: 0.12,
      side: THREE.DoubleSide, depthTest: false, depthWrite: false
    });
    var glowShape = this._roundedRect(barW + 0.04, barH + 0.04, cr + 0.01);
    var glow = new THREE.Mesh(new THREE.ShapeGeometry(glowShape), glowMat);
    glow.position.z = -0.008;
    group.add(glow);

    var ratio = zombie.hp / zombie.maxHp;
    var fillData = this._createFill(ratio, barW, barH, cr);
    group.add(fillData.mesh);

    var dotMat = new THREE.MeshBasicMaterial({
      color: 0x66bbff, transparent: true, opacity: 0.4,
      depthTest: false, depthWrite: false
    });
    var dotGeo = new THREE.CircleGeometry(0.015, 8);
    var dotL = new THREE.Mesh(dotGeo, dotMat);
    dotL.position.set(-barW / 2 - 0.01, 0, 0.005);
    group.add(dotL);
    var dotR = new THREE.Mesh(dotGeo, dotMat);
    dotR.position.set(barW / 2 + 0.01, 0, 0.005);
    group.add(dotR);

    this._bars[id] = {
      group: group, bg: bg, glow: glow, fill: fillData,
      dotL: dotL, dotR: dotR,
      zombie: zombie, lastHp: zombie.hp, lastMaxHp: zombie.maxHp
    };

    this.game.scene.add(group);
  },

  _createFill: function(ratio, barW, barH, cr) {
    ratio = Math.max(0, Math.min(1, ratio));
    var fillW = Math.max(0.02, (barW - 0.04) * ratio);
    var fillH = barH - 0.025;
    var fillCR = Math.min(cr * 0.7, fillW / 2, fillH / 2);
    var shape = this._roundedRect(fillW, fillH, fillCR);
    var col = this._hpColor(ratio);
    var mat = new THREE.MeshBasicMaterial({
      color: col, transparent: true, opacity: 0.92,
      side: THREE.DoubleSide, depthTest: false, depthWrite: false
    });
    var mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
    mesh.position.x = -(barW / 2) + 0.02 + fillW / 2;
    mesh.position.z = 0.005;
    return { mesh: mesh, mat: mat, width: fillW };
  },

  _updateFill: function(fillData, ratio, barW) {
    ratio = Math.max(0, Math.min(1, ratio));
    var fillW = Math.max(0.02, (barW - 0.04) * ratio);
    var fillH = 0.065;
    var fillCR = Math.min(0.021, fillW / 2, fillH / 2);
    var shape = this._roundedRect(fillW, fillH, fillCR);
    fillData.mesh.geometry.dispose();
    fillData.mesh.geometry = new THREE.ShapeGeometry(shape);
    fillData.mesh.material.color.setHex(this._hpColor(ratio));
    fillData.mesh.position.x = -(barW / 2) + 0.02 + fillW / 2;
    fillData.width = fillW;
  },

  _hpColor: function(ratio) {
    if (ratio > 0.6) return 0x44dd44;
    if (ratio > 0.3) return 0xddaa00;
    return 0xdd3333;
  },

  _roundedRect: function(w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    var s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  },

  update: function(dt) {
    if (!this.game || !this.game.camera) return;
    var cam = this.game.camera;
    var barW = 0.55;

    for (var id in this._bars) {
      var b = this._bars[id];
      var z = b.zombie;

      if (!z.alive || z.dying) {
        this._removeBar(id);
        continue;
      }

      if (z.hp !== b.lastHp || z.maxHp !== b.lastMaxHp) {
        this._updateFill(b.fill, z.hp / z.maxHp, barW);
        b.lastHp = z.hp;
        b.lastMaxHp = z.maxHp;
      }

      var pos = z.mesh.position.clone();
      pos.y += 1.05;
      b.group.position.copy(pos);
      b.group.lookAt(cam.position);
    }
  },

  _removeBar: function(id) {
    var b = this._bars[id];
    if (!b) return;
    if (b.group.parent) b.group.parent.remove(b.group);
    var dispose = function(obj) {
      if (obj && obj.geometry) obj.geometry.dispose();
      if (obj && obj.material) obj.material.dispose();
    };
    dispose(b.bg); dispose(b.glow); dispose(b.fill.mesh);
    dispose(b.dotL); dispose(b.dotR);
    delete this._bars[id];
  },

  destroy: function() {
    for (var id in this._bars) this._removeBar(id);
    this._bars = {};
    plugin.off('zombie:spawn', 'fx_zombie_health');
  }
});
