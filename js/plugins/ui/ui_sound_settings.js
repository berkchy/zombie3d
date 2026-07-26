var plugin = include('registry');

plugin.register({
  id: 'ui_sound_settings',
  name: 'Ses Ayarları',
  type: 'ui',
  version: '2.0',
  description: 'Dinamik ses seviyesi ayar paneli — slider ile anlık kontrol, otomatik kayıt',

  game: null,
  panel: null,
  _sliders: {},

  styles:
    '#soundSettingsPanel{position:fixed;top:0;right:0;width:380px;max-width:90vw;height:100%;z-index:250;background:rgba(12,12,18,0.96);border-left:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;transform:translateX(105%);transition:transform .35s cubic-bezier(.22,1,.36,1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}' +
    '#soundSettingsPanel.open{transform:translateX(0);}' +
    '#soundSettingsPanel .ss-header{display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;}' +
    '#soundSettingsPanel .ss-header .ss-title{font-size:15px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.8);flex:1;}' +
    '#soundSettingsPanel .ss-header .ss-close{background:none;border:none;color:rgba(255,255,255,0.3);font-size:22px;cursor:pointer;padding:4px 8px;border-radius:4px;transition:all .2s;line-height:1;}' +
    '#soundSettingsPanel .ss-header .ss-close:hover{color:#fff;background:rgba(255,255,255,0.06);}' +
    '#soundSettingsPanel .ss-body{flex:1;overflow-y:auto;padding:12px 20px 32px;}' +
    '#soundSettingsPanel .ss-body::-webkit-scrollbar{width:4px;}' +
    '#soundSettingsPanel .ss-body::-webkit-scrollbar-track{background:transparent;}' +
    '#soundSettingsPanel .ss-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}' +
    '#soundSettingsPanel .ss-body::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15);}' +
    '.ss-cat{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.15);padding:20px 0 8px;}' +
    '.ss-cat:first-child{padding-top:4px;}' +
    '.ss-row{display:flex;align-items:center;gap:12px;padding:5px 0;}' +
    '.ss-row .ss-label{font-size:13px;color:rgba(255,255,255,0.6);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.ss-row .ss-value{font-size:11px;color:rgba(255,255,255,0.25);width:32px;text-align:right;font-variant-numeric:tabular-nums;}' +
    '.ss-row input[type=range]{-webkit-appearance:none;appearance:none;width:120px;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;outline:none;cursor:pointer;flex-shrink:0;}' +
    '.ss-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:#c62828;border:2px solid rgba(255,255,255,0.1);cursor:pointer;transition:transform .15s;}' +
    '.ss-row input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.15);}' +
    '.ss-row input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#c62828;border:2px solid rgba(255,255,255,0.1);cursor:pointer;}' +
    '.ss-row.ss-master .ss-label{color:#fff;font-weight:600;}' +
    '.ss-row.ss-master input[type=range]::-webkit-slider-thumb{background:#ef5350;width:16px;height:16px;}' +
    '.ss-footer{text-align:center;padding:12px 0 4px;font-size:10px;color:rgba(255,255,255,0.1);letter-spacing:0.5px;border-top:1px solid rgba(255,255,255,0.04);margin-top:8px;flex-shrink:0;}' +
    '.ss-overlay{position:fixed;inset:0;z-index:245;background:rgba(0,0,0,0.3);opacity:0;pointer-events:none;transition:opacity .35s;}' +
    '.ss-overlay.show{opacity:1;pointer-events:auto;}',

  _catOrder: ['genel', 'muzik', 'arayuz', 'oyuncu', 'silahlar', 'yaratiklar', 'boss', 'pickup'],

  _catLabels: {
    genel: 'GENEL',
    muzik: 'MÜZİK',
    arayuz: 'ARAYÜZ',
    oyuncu: 'OYUNCU',
    silahlar: 'SİLAHLAR',
    yaratiklar: 'YARATIKLAR',
    boss: 'BOSS',
    pickup: 'TOPLANABİLİR'
  },

  _getCatLabel(cat) {
    return this._catLabels[cat] || (cat ? cat.toUpperCase() : 'DİĞER');
  },

  init(game) {
    this.game = game;
    this._sliders = {};

    var self = this;

    var overlay = document.createElement('div');
    overlay.className = 'ss-overlay';
    overlay.id = 'ssOverlay';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = 'soundSettingsPanel';
    panel.innerHTML =
      '<div class="ss-header">' +
        '<span class="ss-title">Ses Ayarları</span>' +
        '<button class="ss-close" id="ssClose">&times;</button>' +
      '</div>' +
      '<div class="ss-body" id="ssBody"></div>' +
      '<div class="ss-footer">ayarlar otomatik kaydedilir</div>';
    document.body.appendChild(panel);
    this.panel = panel;

    document.getElementById('ssClose').addEventListener('click', function() {
      self._close();
    });
    overlay.addEventListener('click', function() {
      self._close();
    });

    document.addEventListener('soundSettings:open', function() {
      self._rebuild();
      self._open();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && self.panel.classList.contains('open')) {
        self._close();
      }
    });
  },

  _open() {
    document.getElementById('ssOverlay').classList.add('show');
    this.panel.classList.add('open');
  },

  _close() {
    document.getElementById('ssOverlay').classList.remove('show');
    this.panel.classList.remove('open');
  },

  _rebuild() {
    var body = document.getElementById('ssBody');
    if (!body) return;
    body.innerHTML = '';
    this._sliders = {};

    var bank = this.game && this.game.sound && this.game.sound._bank;
    if (!bank) {
      body.innerHTML = '<div style="padding:40px 0;text-align:center;color:rgba(255,255,255,0.15);font-size:12px;">Ses sistemi hazır değil</div>';
      return;
    }

    var self = this;
    var catMap = {};
    var idOrder = [];

    Object.keys(bank).forEach(function(id) {
      var entry = bank[id];
      if (!entry.label || !entry.cat) return;
      var cat = entry.cat;
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push({ id: id, label: entry.label, cat: cat });
      idOrder.push(id);
    });

    var masterEntry = { id: 'master', label: 'Ana Ses', cat: 'genel', master: true };

    var seenCats = {};

    if (catMap['genel']) {
      catMap['genel'].unshift(masterEntry);
    }

    self._catOrder.forEach(function(cat) {
      var list = catMap[cat];
      if (!list || list.length === 0) return;
      seenCats[cat] = true;

      var catEl = document.createElement('div');
      catEl.className = 'ss-cat';
      catEl.textContent = self._getCatLabel(cat);
      body.appendChild(catEl);

      list.forEach(function(s) {
        var row = document.createElement('div');
        row.className = 'ss-row' + (s.master ? ' ss-master' : '');

        var label = document.createElement('span');
        label.className = 'ss-label';
        label.textContent = s.label;
        row.appendChild(label);

        var slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 100;

        var saved = PluginStorageAPI.get('ss_vol_' + s.id, null);
        var defaultVol = s.master ? 80 : 70;
        var vol = saved !== null ? parseInt(saved, 10) : defaultVol;
        slider.value = vol;

        var valEl = document.createElement('span');
        valEl.className = 'ss-value';
        valEl.textContent = vol;

        self._sliders[s.id] = { slider: slider, value: valEl };

        slider.addEventListener('input', function(sid) {
          return function() {
            var v = parseInt(this.value, 10);
            valEl.textContent = v;
            PluginStorageAPI.set('ss_vol_' + sid, String(v));
            self._applyVolume(sid, v / 100);
          };
        }(s.id));

        row.appendChild(slider);
        row.appendChild(valEl);
        body.appendChild(row);

        self._applyVolume(s.id, vol / 100);
      });
    });

    Object.keys(catMap).forEach(function(cat) {
      if (seenCats[cat]) return;
      var list = catMap[cat];
      if (!list || list.length === 0) return;
      var catEl = document.createElement('div');
      catEl.className = 'ss-cat';
      catEl.textContent = self._getCatLabel(cat);
      body.appendChild(catEl);
      list.forEach(function(s) {
        var row = document.createElement('div');
        row.className = 'ss-row';
        var label = document.createElement('span');
        label.className = 'ss-label';
        label.textContent = s.label;
        row.appendChild(label);
        var slider = document.createElement('input');
        slider.type = 'range'; slider.min = 0; slider.max = 100;
        var saved = PluginStorageAPI.get('ss_vol_' + s.id, null);
        var vol = saved !== null ? parseInt(saved, 10) : 70;
        slider.value = vol;
        var valEl = document.createElement('span');
        valEl.className = 'ss-value';
        valEl.textContent = vol;
        self._sliders[s.id] = { slider: slider, value: valEl };
        slider.addEventListener('input', function(sid) {
          return function() {
            var v = parseInt(this.value, 10);
            valEl.textContent = v;
            PluginStorageAPI.set('ss_vol_' + sid, String(v));
            self._applyVolume(sid, v / 100);
          };
        }(s.id));
        row.appendChild(slider);
        row.appendChild(valEl);
        body.appendChild(row);
        self._applyVolume(s.id, vol / 100);
      });
    });
  },

  _applyVolume(soundId, vol) {
    if (soundId === 'master') {
      if (this.game && this.game.sound) this.game.sound.setMasterVolume(vol);
      return;
    }
    if (!this.game || !this.game.sound) return;
    var snd = this.game.sound;
    if (snd._bank[soundId] && snd._bank[soundId].variants) {
      snd._bank[soundId].variants.forEach(function(v) {
        if (v) v.volume = vol;
      });
    }
    if (snd._sounds[soundId]) {
      snd._sounds[soundId].forEach(function(howl) {
        if (howl) howl.volume(vol);
      });
    }
  },

  destroy() {
    if (this.panel) this.panel.remove();
    var ov = document.getElementById('ssOverlay');
    if (ov) ov.remove();
    plugin.removeStyles(this.id);
  }
});
