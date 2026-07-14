PluginRegistry.register({
  id: 'mod_combo_speed',
  name: 'Hız Kombosu',
  type: 'core',
  version: '1.0',
  description: 'Her öldürmede hız artar (max 3 kat)',
  enabled: false,
  priority: 50,

  combo: 0,
  baseSpeed: 6,
  comboWindow: 3,

  init(game) {
    this.combo = 0;

    PluginRegistry.on('zombie:die', 'mod_combo_speed', function() {
      this.combo++;
      const player = PluginRegistry.get('player_basic');
      if (!player || !player.enabled) return;
      if (this.combo === 1) this.baseSpeed = player.speed;
      const multiplier = Math.min(1 + this.combo * 0.2, 3);
      player.speed = this.baseSpeed * multiplier;
    }.bind(this));

    // 3 sn içinde öldürme olmazsa combo sıfırlanır
    this.timer = 0;
  },

  update(dt) {
    if (this.combo > 0) {
      this.timer += dt;
      if (this.timer > this.comboWindow) {
        this.combo = 0;
        this.timer = 0;
        const player = PluginRegistry.get('player_basic');
        if (player && player.enabled) player.speed = this.baseSpeed;
      }
    }
  },

  // Overlay'de combo göstergesi
  render2d(ctx, w, h) {
    if (this.combo < 2) return;
    ctx.save();
    ctx.font = 'bold 28px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,200,50,0.9)';
    ctx.shadowColor = 'rgba(255,200,50,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(this.combo + 'x COMBO!', w / 2, h - 40);
    ctx.restore();
  },

  destroy() {
    const player = PluginRegistry.get('player_basic');
    if (player && player.enabled) player.speed = 6;
  }
});
