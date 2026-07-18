var plugin = include('registry');

plugin.register({
  id: 'fx_damage_slow',
  name: 'Hasar Yavaslatma',
  type: 'fx',
  version: '1.0',
  description: 'Hasar alinca oyuncu 1.5sn yavaslar, tekrar hasar alirsa sure sifirlanir',
  priority: 30,
  enabled: true,

  slowMultiplier: 0.5,
  slowDuration: 1.5,
  _origSpeed: null,
  _timer: null,

  init(game) {
    var self = this;

    plugin.on('player:hit', this.id, function(data) {
      var movePlugin = plugin.get('player_movement');
      if (!movePlugin || !movePlugin.enabled) return;

      if (self._timer === null) {
        self._origSpeed = movePlugin.speed;
      } else {
        clearTimeout(self._timer);
      }

      movePlugin.speed = self._origSpeed * self.slowMultiplier;

      self._timer = setTimeout(function() {
        if (self._origSpeed !== null) {
          var mp = plugin.get('player_movement');
          if (mp && mp.enabled) mp.speed = self._origSpeed;
        }
        self._origSpeed = null;
        self._timer = null;
      }, self.slowDuration * 1000);
    });
  },

  destroy() {
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (this._origSpeed !== null) {
      var movePlugin = plugin.get('player_movement');
      if (movePlugin && movePlugin.enabled) {
        movePlugin.speed = this._origSpeed;
      }
      this._origSpeed = null;
    }
    plugin.off('player:hit', this.id);
  }
});
