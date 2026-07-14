PluginRegistry.register({
  id: 'ui_level',
  name: 'Level/XP Göstergesi',
  version: '1.0',
  type: 'ui',
  description: 'Level ve XP bar gösterimi',
  enabled: true,

  styles: '#levelContainer{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);text-align:center;z-index:150;pointer-events:none;}' +
    '#levelLabel{color:#fff;font-family:monospace;font-size:14px;text-shadow:0 0 6px #00ff88;margin-bottom:4px;}' +
    '#xpBarOuter{width:180px;height:8px;background:rgba(255,255,255,0.15);border-radius:4px;overflow:hidden;margin:0 auto;}' +
    '#xpFill{width:0%;height:100%;background:linear-gradient(90deg,#00ff88,#00ccff);border-radius:4px;transition:width 0.3s;}' +
    '#xpText{color:rgba(255,255,255,0.6);font-family:monospace;font-size:10px;margin-top:2px;}' +
    '.levelup-popup{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#00ff88;font-family:monospace;font-size:32px;font-weight:bold;text-shadow:0 0 20px #00ff88,0 0 40px #00ff88;z-index:160;pointer-events:none;animation:levelUpAnim 1.5s forwards;}',

  levelEl: null,
  xpFillEl: null,

  init(game) {
    var container = document.createElement('div');
    container.id = 'levelContainer';

    var label = document.createElement('div');
    label.id = 'levelLabel';
    label.textContent = 'Level 1';
    container.appendChild(label);
    this.levelEl = label;

    var barOuter = document.createElement('div');
    barOuter.id = 'xpBarOuter';

    var barFill = document.createElement('div');
    barFill.id = 'xpFill';
    barOuter.appendChild(barFill);
    this.xpFillEl = barFill;
    container.appendChild(barOuter);

    var xpText = document.createElement('div');
    xpText.id = 'xpText';
    xpText.textContent = '0 / 50 XP';
    container.appendChild(xpText);
    this.xpTextEl = xpText;

    document.body.appendChild(container);

    // Oyun baslamadiginda gizle
    container.style.display = 'none';
    PluginRegistry.on('game:start', this.id, function() {
      container.style.display = 'block';
    });
    PluginRegistry.on('game:over', this.id, function() {
      container.style.display = 'none';
    });

    var self = this;
    PluginRegistry.on('player:levelup', this.id, function(data) {
      self.showLevelUp(data.level);
      self.updateDisplay(data);
    });
    PluginRegistry.on('player:xp', this.id, function(data) {
      self.updateDisplay(data);
    });
  },

  updateDisplay: function(data) {
    var player = data.player;
    var pct = Math.min(100, (player.xp / player.xpToNext) * 100);
    this.levelEl.textContent = 'Level ' + player.level;
    this.xpFillEl.style.width = pct + '%';
    this.xpTextEl.textContent = player.xp + ' / ' + player.xpToNext + ' XP';
  },

  showLevelUp: function(level) {
    var el = document.createElement('div');
    el.className = 'levelup-popup';
    el.textContent = 'LEVEL ' + level + '!';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 1600);
  },

  destroy() {
    var el = document.getElementById('levelContainer');
    if (el) el.remove();
    PluginRegistry.off('player:levelup', this.id);
    PluginRegistry.off('player:xp', this.id);
    PluginRegistry.removeStyles(this.id);
  }
});
