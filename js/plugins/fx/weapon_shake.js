var plugin = include('registry');

plugin.register({
  id: 'weapon_shake',
  name: 'Silah Sarsintisi',
  type: 'core',
  version: '2.0',
  description: 'Ates ederken kamera recoil + smooth ease-out geri donus',
  enabled: true,
  priority: 95,

  _recoverRate: 4.0,
  _maxPitch: 0.4,
  _maxYaw: 0.2,

  init() {
    var self = this;

    plugin.on('weapon:fire', this.id, function(data) {
      if (!data || !data.weapon) return;
      var shake = data.weapon.shake;
      if (!shake || shake <= 0) return;

      if (game._recoilPitch === undefined) game._recoilPitch = 0;
      if (game._recoilYaw === undefined) game._recoilYaw = 0;

      game._recoilPitch = Math.min(self._maxPitch, game._recoilPitch + shake);
      game._recoilYaw += (Math.random() - 0.5) * shake * 0.6;
      if (Math.abs(game._recoilYaw) > self._maxYaw) {
        game._recoilYaw = Math.sign(game._recoilYaw) * self._maxYaw;
      }
    });
  },

  update(dt) {
    if (game._recoilPitch === undefined) return;
    if (game._recoilPitch < 0.0001 && Math.abs(game._recoilYaw) < 0.0001) {
      game._recoilPitch = 0;
      game._recoilYaw = 0;
      return;
    }

    game._recoilPitch *= (1 - this._recoverRate * dt);
    game._recoilYaw *= (1 - this._recoverRate * dt);
  },

  destroy() {
    plugin.off('weapon:fire', this.id);
    if (game) {
      game._recoilPitch = 0;
      game._recoilYaw = 0;
    }
  }
});
