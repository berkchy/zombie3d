PluginRegistry.register({
  id: 'ui_blood_overlay',
  name: 'Kan Efekti',
  type: 'ui',
  version: '1.0',
  description: 'Hasar alınca ekran kızarır',
  enabled: true,
  priority: 90,

  intensity: 0,
  game: null,

  init(game) {
    this.game = game;
    this.intensity = 0;

    PluginRegistry.on('player:hit', 'ui_blood_overlay', function(data) {
      this.intensity = Math.min(1, this.intensity + 0.3);
    }.bind(this));
  },

  update(dt) {
    this.intensity = Math.max(0, this.intensity - dt * 0.5);
  },

  render2d(ctx, w, h) {
    if (this.intensity <= 0.01) return;

    ctx.save();
    const alpha = this.intensity * 0.4;
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(180,0,0,' + alpha + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Kenarlarda belirginleşir
    ctx.strokeStyle = 'rgba(180,0,0,' + (alpha * 0.6) + ')';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.restore();
  },

  destroy() {}
});
