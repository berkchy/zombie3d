var plugin = include('registry');

plugin.register({
  id: 'system_reload',
  name: 'Reload Sistemi',
  type: 'core',
  version: '1.0',
  description: 'Reload — magazine tek seferde, shotgun tek tek mermi',
  enabled: true,
  priority: 55,

  _reloading: false,
  _wp: null,

  styles:
    '#reload-ui{position:fixed;bottom:175px;left:50%;transform:translateX(-50%);z-index:150;text-align:center;display:none;pointer-events:none;}' +
    '.reload-text{color:#fff;font-family:monospace;font-size:18px;font-weight:bold;text-shadow:0 0 10px rgba(0,0,0,.8);letter-spacing:3px;margin-bottom:6px;}' +
    '.reload-bar{width:160px;height:5px;background:rgba(255,255,255,.12);border-radius:3px;overflow:hidden;margin:0 auto;}' +
    '.reload-fill{width:0%;height:100%;background:#4fc3f7;border-radius:3px;}',

  init(game) {
    this._game = game;
    this._reloading = false;

    var self = this;

    this._onKey = function(e) {
      if (e.key === 'r' || e.key === 'R') {
        self._startReload();
      }
    };
    document.addEventListener('keydown', this._onKey);

    plugin.on('reload:start', this.id, function() {
      self._startReload();
    });

    plugin.on('hotbar:select', this.id, function() {
      if (self._reloading) {
        self._reloading = false;
        self._hideUI();
      }
      self._updateReloadBtn();
    });

    plugin.on('weapon:fire', this.id, function(data) {
      if (!self._reloading && data.weapon && data.weapon.ammo !== undefined && data.weapon.ammo <= 0) {
        self._startReload();
      }
    });

    plugin.on('ammo:change', this.id, function() {
      self._updateReloadBtn();
    });
  },

  _getWeapon: function() {
    if (!this._game || !this._game.hotbar) return null;
    var sel = this._game.hotbar.getSelected();
    if (!sel || !sel.slot || !sel.slot.id) return null;
    return plugin.get(sel.slot.id);
  },

  _startReload: function() {
    if (this._reloading) return;

    var wp = this._getWeapon();
    if (!wp) return;
    if (wp.weaponType === 'knife') return;
    if (wp.ammo >= wp.clip || wp.maxAmmo <= 0) return;

    this._reloading = true;
    this._wp = wp;

    if (wp.reloadMode === 'shell') {
      this._shellTotal = Math.min(wp.clip - wp.ammo, wp.maxAmmo);
      this._shellLoaded = 0;
      this._shellTime = 0;
    } else {
      this._reloadTimer = wp.reloadTime || 1.5;
    }

    this._showUI();

    plugin.emit('reload:start', { weapon: wp });
  },

  update: function(dt) {
    if (!this._reloading) {
      var wp = this._getWeapon();
      if (wp && wp.ammo !== undefined && wp.ammo <= 0 && wp.maxAmmo > 0 && wp.ammo < wp.clip) {
        this._startReload();
      }
    }

    this._updateReloadBtn();

    if (!this._reloading || !this._wp) return;

    var wp = this._wp;
    var fill = document.querySelector('.reload-fill');
    if (!fill) return;

    if (wp.reloadMode === 'shell') {
      this._shellTime += dt;

      var pct = this._shellTime / (wp.reloadTime || 0.5);
      if (pct >= 1) {
        pct = 0;
        this._shellTime = 0;
        this._shellLoaded++;

        wp.ammo++;
        wp.maxAmmo--;

        plugin.emit('ammo:change', { ammo: wp.ammo, maxAmmo: wp.maxAmmo, clip: wp.clip });

        if (this._shellLoaded >= this._shellTotal || wp.ammo >= wp.clip || wp.maxAmmo <= 0) {
          this._reloading = false;
          this._wp = null;
          this._hideUI();
          return;
        }
      }
      fill.style.width = ((this._shellLoaded + pct) / this._shellTotal * 100) + '%';
    } else {
      this._reloadTimer -= dt;

      fill.style.width = ((1 - this._reloadTimer / (wp.reloadTime || 1.5)) * 100) + '%';

      if (this._reloadTimer <= 0) {
        var needed = wp.clip - wp.ammo;
        var taken = Math.min(needed, wp.maxAmmo);
        if (taken > 0) {
          wp.ammo += taken;
          wp.maxAmmo -= taken;
          plugin.emit('ammo:change', { ammo: wp.ammo, maxAmmo: wp.maxAmmo, clip: wp.clip });
        }
        this._reloading = false;
        this._wp = null;
        this._hideUI();
      }
    }
  },

  _showUI: function() {
    var el = document.getElementById('reload-ui');
    if (!el) {
      el = document.createElement('div');
      el.id = 'reload-ui';
      el.innerHTML = '<div class="reload-text">RELOAD\u0130NG</div><div class="reload-bar"><div class="reload-fill"></div></div>';
      document.body.appendChild(el);
    }
    el.style.display = 'block';
    var fill = el.querySelector('.reload-fill');
    if (fill) fill.style.width = '0%';
  },

  _hideUI: function() {
    var el = document.getElementById('reload-ui');
    if (el) el.style.display = 'none';
  },

  _updateReloadBtn: function() {
    var tb = plugin.get('system_touch_buttons');
    if (!tb) return;
    if (!tb._buttons || !tb._buttons['reload']) {
      tb.touchAdd('reload', {
        label: 'RELOAD', x: 87, y: 65, width: 68, height: 68,
        shape: 'circle', bgColor: 'rgba(0,0,0,.5)', color: '#fff',
        fontSize: 11, zIndex: 200,
        html: '<svg viewBox="0 0 40 40" width="24" height="24"><path d="M20 8a12 12 0 1 0 8.5 3.5" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><polyline points="20,2 26,8 20,14" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        onClick: function() { var r = plugin.get('system_reload'); if (r && r._startReload) r._startReload(); }
      });
    }
  },

  destroy: function() {
    document.removeEventListener('keydown', this._onKey);
    plugin.off('reload:start', this.id);
    plugin.off('hotbar:select', this.id);
    plugin.off('weapon:fire', this.id);
    plugin.off('ammo:change', this.id);
    this._hideUI();
  }
});
