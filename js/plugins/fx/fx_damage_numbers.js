var plugin = include('registry');
var loader = include('loader');

plugin.register({
  id: 'fx_damage_numbers',
  name: 'Hasar Numaralari',
  type: 'graphics',
  version: '5.0',
  description: 'Zombi kafasinda hasar miktarini 3D model olarak gosterir (toplamali)',
  enabled: true,

  _numbers: null,
  _pending: null,

  init() {
    this._numbers = [];
    this._pending = [];
    this._nextId = 1;
    loader.loadScript('model_digits', function(){});

    var self = this;
    plugin.on('enemy:hit', this.id, function(data) {
      if (!data || !data.position || data.damage <= 0) return;
      self._pending.push({
        pos: data.position.clone(),
        damage: data.damage,
        enemy: data.enemy
      });
    });
  },

  _spawn(pos, amount, headY) {
    var md = plugin.get('model_digits');
    if (!md || !md.createNumber) return;

    var color = amount >= 100 ? 0xff4444 : amount >= 50 ? 0xff8844 : 0xffcc44;
    var group = md.createNumber(amount, color);

    if (headY === undefined) headY = pos ? pos.y + 0.9 : 0;
    group.position.set(pos ? pos.x : 0, headY + 0.15, pos ? pos.z : 0);
    var s = 0.8;
    group.scale.set(s, s, s);
    group.renderOrder = 999;

    if (game && game.scene) game.scene.add(group);

    this._numbers.push({
      group: group,
      damage: amount,
      life: 1.5, maxLife: 1.5,
      baseY: group.position.y
    });
  },

  update(dt) {
    if (this._pending.length > 0) {
      var groups = {};
      for (var i = 0; i < this._pending.length; i++) {
        var p = this._pending[i];

        var enemy = p.enemy;
        var key;
        if (enemy && enemy._moveId) {
          key = enemy._moveId;
        } else if (enemy) {
          if (!enemy.__dmgId) {
            enemy.__dmgId = this._nextId++;
          }
          key = '__e' + enemy.__dmgId;
        } else {
          key = p.pos.x + ',' + p.pos.y + ',' + p.pos.z;
        }

        if (!groups[key]) {
          var headY;
          var hb = plugin.get('system_hitbox');
          if (hb && hb.enabled && enemy && enemy.mesh) {
            var hp = hb.getHeadWorldPos(enemy.mesh);
            if (hp) headY = hp.y;
          }
          if (headY === undefined) {
            headY = p.pos ? p.pos.y + 0.9 : 0;
          }
          groups[key] = { damage: 0, pos: p.pos.clone(), headY: headY };
        }
        groups[key].damage += p.damage;
        groups[key].pos.copy(p.pos);
        if (enemy && enemy.mesh) {
          var hb = plugin.get('system_hitbox');
          if (hb && hb.enabled) {
            var hp = hb.getHeadWorldPos(enemy.mesh);
            if (hp) groups[key].headY = hp.y;
          }
        }
      }

      for (var key in groups) {
        var g = groups[key];
        var total = Math.round(g.damage);
        if (total > 0) {
          this._spawn(g.pos, total, g.headY);
        }
      }

      this._pending = [];
    }

    for (var i = this._numbers.length - 1; i >= 0; i--) {
      var n = this._numbers[i];
      n.life -= dt;

      var t = Math.max(0, n.life / n.maxLife);

      n.group.position.y = n.baseY + (1 - t) * 0.4;

      if (game && game.camera) n.group.lookAt(game.camera.position);

      n.group.traverse(function(m) {
        if (m.isMesh && m.material) {
          m.material.opacity = Math.pow(t, 0.5);
          m.material.transparent = true;
        }
      });

      if (n.life <= 0) {
        if (n.group.parent) n.group.parent.remove(n.group);
        n.group.traverse(function(m) {
          if (m.isMesh) {
            if (m.geometry) m.geometry.dispose();
            if (m.material) m.material.dispose();
          }
        });
        this._numbers.splice(i, 1);
      }
    }
  },

  destroy() {
    this._pending = [];
    for (var i = 0; i < this._numbers.length; i++) {
      var n = this._numbers[i];
      if (n.group.parent) n.group.parent.remove(n.group);
      n.group.traverse(function(m) {
        if (m.isMesh) {
          if (m.geometry) m.geometry.dispose();
          if (m.material) m.material.dispose();
        }
      });
    }
    this._numbers = [];
    plugin.off('enemy:hit', this.id);
  }
});
