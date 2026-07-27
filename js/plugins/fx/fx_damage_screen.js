var plugin = include('registry');

plugin.register({
  id: 'fx_damage_screen',
  name: 'Ekran Hasar Efektleri',
  type: 'graphics',
  version: '1.0',
  description: 'Hasar alinca kirmizi flash + dusuk can vignette',
  priority: 11,

  _flashAlpha: 0,
  _lowHpTimer: 0,

  init() {
    var self = this;

    plugin.on('player:hit', this.id, function(data) {
      if (!data) return;
      self._flashAlpha = Math.min(1, self._flashAlpha + 0.4 + (data.damage || 0) * 0.005);
    });

    plugin.on('player:heal', this.id, function() {
      self._flashAlpha = 0;
    });
  },

  render2d(ctx, w, h) {
    var hp = 0, maxHp = 1;
    if (game && game.player) {
      hp = game.player.hp || 0;
      maxHp = game.player.maxHp || 100;
    }
    var hpRatio = hp / maxHp;

    // 1) Damage flash
    if (this._flashAlpha > 0.01) {
      ctx.fillStyle = 'rgba(180,10,10,' + (this._flashAlpha * 0.3) + ')';
      ctx.fillRect(0, 0, w, h);
      this._flashAlpha *= 0.85;
    } else {
      this._flashAlpha = 0;
    }

    // 2) Low health vignette
    if (hpRatio < 0.35 && hp > 0) {
      var intensity = (1 - hpRatio / 0.35);
      var pulse = 0.85 + Math.sin(Date.now() * 0.005) * 0.15;
      var alpha = intensity * 0.4 * pulse;

      // Kenarlardan ice dogru gradient
      var g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(120,0,0,0)');
      g.addColorStop(1, 'rgba(120,0,0,' + alpha + ')');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  },

  destroy() {
    plugin.off('player:hit', this.id);
    plugin.off('player:heal', this.id);
  }
});
