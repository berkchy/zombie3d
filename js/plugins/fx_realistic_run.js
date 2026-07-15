PluginRegistry.register({
  id: 'fx_realistic_run',
  name: 'Gercekci Kosma',
  type: 'fx',
  version: '1.0',
  description: 'Can azaldikca kosma hizi duser',
  priority: 40,
  enabled: true,

  _baseSpeed: null,

  init(game) {
    var self = this;

    function updateSpeed() {
      var movePlugin = PluginRegistry.get('player_movement');
      if (!movePlugin || !movePlugin.enabled) return;

      if (self._baseSpeed === null) {
        self._baseSpeed = movePlugin.speed;
      }

      var player = game.player;
      if (!player) return;

      var ratio = Math.max(0, player.hp / player.maxHp);
      var multiplier = 0.35 + 0.65 * ratio;
      movePlugin.speed = self._baseSpeed * multiplier;
    }

    PluginRegistry.on('player:hit', this.id, updateSpeed);
    PluginRegistry.on('player:heal', this.id, updateSpeed);
    PluginRegistry.on('game:start', this.id, function() {
      self._baseSpeed = null;
      updateSpeed();
    });
    PluginRegistry.on('game:restart', this.id, function() {
      self._baseSpeed = null;
    });
  },

  destroy() {
    this._baseSpeed = null;
    PluginRegistry.off('player:hit', this.id);
    PluginRegistry.off('player:heal', this.id);
    PluginRegistry.off('game:start', this.id);
    PluginRegistry.off('game:restart', this.id);
  }
});
