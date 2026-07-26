var plugin = include('registry');

plugin.register({
  id: 'dev_hitlogger',
  name: 'Hit Logger',
  type: 'core',
  version: '1.0',
  description: 'Mermi takibi — baslangic, bitis, isabet bolgesi',

  _lastShot: null,
  _bulletId: 0,

  init() {
    this._lastShot = null;
    var self = this;

    plugin.on('weapon:fire', this.id, function(data) {
      if (!data || !data.position) return;
      var bid = ++self._bulletId;
      var pos = data.position;
      var dir = data.direction;
      var label = '';
      if (data.weapon) label = data.weapon.name || data.weapon.id || data.weapon._label || '';
      if (data.pellets) label += ' (x' + data.pellets + ')';

      self._lastShot = {
        bid: bid,
        pos: pos.clone(),
        dir: dir ? dir.clone() : null,
        label: label
      };

      var p = pos;
      var dx = dir ? dir.x : 0;
      var dy = dir ? dir.y : 0;
      var dz = dir ? dir.z : 0;
      console.log('[#' + bid + '] ' + label + ' ATES | baslangic: (' + p.x.toFixed(2) + ', ' + p.y.toFixed(2) + ', ' + p.z.toFixed(2) + ')  yon: (' + dx.toFixed(2) + ', ' + dy.toFixed(2) + ', ' + dz.toFixed(2) + ')');
    });

    plugin.on('zombie:hit', this.id, function(data) {
      if (!data) return;
      var pos = data.position;
      var z = data.zombie;
      var zId = (z && z._moveId) || (z && z.id) || '?';
      var zHp = data.hp !== undefined ? data.hp : '?';
      var dmg = data.damage || 0;
      var dist = pos && game.camera ? pos.distanceTo(game.camera.position) : 0;

      console.log('[HIT] zombie=' + zId + '  bolge=' + (data.hitType || '?') + '  hasar=' + dmg + '  kalanHP=' + zHp + (pos ? '  konum=(' + pos.x.toFixed(2) + ', ' + pos.y.toFixed(2) + ', ' + pos.z.toFixed(2) + ')  mesafe=' + dist.toFixed(1) + 'm' : ''));
    });

    plugin.on('bullet:impact', this.id, function(data) {
      if (!data || !data.position) return;
      var p = data.position;
      var tip = data.type === 'wall' ? 'DUVAR' : (data.type === 'flesh' ? 'ZOMBI' : data.type);
      var dist = p && game.camera ? p.distanceTo(game.camera.position) : 0;

      console.log('[IMPACT] ' + tip + '  konum=(' + p.x.toFixed(2) + ', ' + p.y.toFixed(2) + ', ' + p.z.toFixed(2) + ')  mesafe=' + dist.toFixed(1) + 'm');
    });

    plugin.on('system_bullet:miss', 'dev_hitlogger', function(data) {
      console.log('[MISS] ' + (data ? data.count : '?') + ' mermi hedefe ulasmadi / sinir disi');
    });
  },

  destroy() {
    plugin.off('weapon:fire', this.id);
    plugin.off('zombie:hit', this.id);
    plugin.off('bullet:impact', this.id);
    plugin.off('system_bullet:miss', 'dev_hitlogger');
    this._lastShot = null;
  }
});
