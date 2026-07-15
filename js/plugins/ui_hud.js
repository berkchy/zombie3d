PluginRegistry.register({
  id: 'ui_hud',
  name: 'HUD',
  type: 'ui',
  version: '1.0',
  description: 'Can, puan ve dalga gostergesi',
  priority: 50,
  enabled: true,

  styles:
    '#hud{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);display:none;align-items:center;gap:20px;z-index:30;color:#fff;user-select:none;pointer-events:none;}' +
    '#hud.show{display:flex;}' +
    '.hd-sec{display:flex;align-items:center;gap:6px;}' +
    '.hd-hp-icon{font-size:16px;color:#e53935;line-height:1;}' +
    '.hd-hp-track{width:100px;height:8px;background:rgba(0,0,0,0.45);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);}' +
    '#hpFill{height:100%;background:linear-gradient(90deg,#b71c1c,#e53935,#ff5252);border-radius:3px;transition:width .2s ease;box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 0 6px rgba(229,57,53,0.3);}' +
    '.hd-lbl{font-size:9px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,0.25);}' +
    '.hd-val{font-size:16px;font-weight:700;color:rgba(255,255,255,0.9);font-variant-numeric:tabular-nums;min-width:24px;text-align:right;}' +
    '#waveLabel{font-size:9px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:rgba(255,255,255,0.25);display:flex;align-items:center;gap:5px;}' +
    '#waveVal{font-size:16px;font-weight:700;color:#4fc3f7;font-variant-numeric:tabular-nums;min-width:18px;text-align:right;letter-spacing:0;text-transform:none;}' +
    '.hd-dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.12);}',

  container: null,
  hpFill: null,
  scoreVal: null,

  init(game) {
    var c = document.createElement('div');
    c.id = 'hud';

    // HP
    var hpSec = document.createElement('div');
    hpSec.className = 'hd-sec';
    var icon = document.createElement('span');
    icon.className = 'hd-hp-icon';
    icon.textContent = '\u2665';
    hpSec.appendChild(icon);
    var track = document.createElement('div');
    track.className = 'hd-hp-track';
    var fill = document.createElement('div');
    fill.id = 'hpFill';
    fill.style.width = '100%';
    track.appendChild(fill);
    hpSec.appendChild(track);
    c.appendChild(hpSec);

    // dot
    var d1 = document.createElement('span');
    d1.className = 'hd-dot';
    c.appendChild(d1);

    // Score
    var scSec = document.createElement('div');
    scSec.className = 'hd-sec';
    var scLbl = document.createElement('span');
    scLbl.className = 'hd-lbl';
    scLbl.textContent = 'Puan';
    scSec.appendChild(scLbl);
    var scVal = document.createElement('span');
    scVal.className = 'hd-val';
    scVal.id = 'scoreVal';
    scVal.textContent = '0';
    scSec.appendChild(scVal);
    c.appendChild(scSec);

    // dot
    var d2 = document.createElement('span');
    d2.className = 'hd-dot';
    c.appendChild(d2);

    // Wave
    var wvSec = document.createElement('div');
    wvSec.id = 'waveLabel';
    // waveLabel icerigi JS tarafindan innerHTML/textContent ile ayarlanir
    c.appendChild(wvSec);

    document.body.appendChild(c);
    this.container = c;
    this.hpFill = fill;

    var self = this;
    PluginRegistry.on('game:start', this.id, function() { c.classList.add('show'); });
    PluginRegistry.on('game:over', this.id, function() { c.classList.remove('show'); });
  },

  destroy() {
    PluginRegistry.off('game:start', this.id);
    PluginRegistry.off('game:over', this.id);
    if (this.container) this.container.remove();
    PluginRegistry.removeStyles(this.id);
  }
});
