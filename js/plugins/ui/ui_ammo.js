var plugin = include('registry');

var typeLabels = { pistol: 'TABANCA', shotgun: 'POMPALI', smg: 'SMG', rifle: 'TÜFEK', machinegun: 'MAKİNELİ', knife: 'BIÇAK' };

plugin.register({
  id: 'ui_ammo',
  name: 'Mermi Sayac\u0131',
  type: 'ui',
  version: '1.0',
  description: 'Eldeki silah\u0131n mermi/g\u00f6rg\u00fc g\u00f6stergesi',
  enabled: true,
  priority: 60,

  currentAmmo: 0,
  maxAmmo: 0,

  styles:
    '#ui-ammo{position:fixed;bottom:110px;right:30px;color:#fff;font-family:monospace;font-size:28px;font-weight:bold;text-shadow:0 0 10px rgba(0,0,0,.8);z-index:100;pointer-events:none;text-align:right;line-height:1;display:none;}' +
    '#ui-ammo .ammo-current{color:#4fc3f7;}' +
    '#ui-ammo .ammo-sep{color:rgba(255,255,255,.25);margin:0 4px;}' +
    '#ui-ammo .ammo-clip{color:rgba(255,255,255,.45);font-size:20px;}' +
    '#ui-ammo .ammo-reserve{font-size:14px;color:rgba(255,255,255,.25);margin-top:2px;}' +
    '#ui-ammo .ammo-type{font-size:11px;color:rgba(255,255,255,.3);margin-top:4px;letter-spacing:1px;}',

  init(game) {
    var el = document.createElement('div');
    el.id = 'ui-ammo';
    el.innerHTML = '<span class="ammo-current">0</span><span class="ammo-sep">/</span><span class="ammo-clip">0</span><div class="ammo-reserve"></div><div class="ammo-type"></div>';
    document.body.appendChild(el);
    this.el = el;
    this._elCurrent = el.querySelector('.ammo-current');
    this._elClip = el.querySelector('.ammo-clip');
    this._elReserve = el.querySelector('.ammo-reserve');
    this._elType = el.querySelector('.ammo-type');

    var self = this;

    plugin.on('ammo:change', this.id, function(data) {
      self.currentAmmo = data.ammo;
      self._clip = data.clip || 0;
      self._reserve = data.maxAmmo || 0;
      self._update();
    });

    plugin.on('hotbar:select', this.id, function(data) {
      if (!data.slot || !data.slot.id) {
        self.el.style.display = 'none';
        return;
      }
      var wp = plugin.get(data.slot.id);
      if (!wp || !wp.enabled) {
        self.el.style.display = 'none';
        return;
      }
      self.currentAmmo = wp.ammo !== undefined ? wp.ammo : 0;
      self._clip = wp.clip || 0;
      self._reserve = wp.maxAmmo || 0;
      self._elType.textContent = typeLabels[wp.weaponType] || wp.weaponType.toUpperCase();
      if (wp.weaponType === 'knife') {
        self.el.style.display = 'none';
      } else {
        self.el.style.display = 'block';
        self._update();
      }
    });

    plugin.on('weapon:fire', this.id, function(data) {
      if (data.weapon) {
        self.currentAmmo = data.ammo !== undefined ? data.ammo : 0;
        self._clip = data.weapon.clip || 0;
        self._reserve = data.weapon.maxAmmo || 0;
        self._update();
      }
    });
  },

  _update() {
    this._elCurrent.textContent = this.currentAmmo;
    this._elClip.textContent = this._clip;
    this._elReserve.textContent = '\u00a0 ' + this._reserve;
  },

  destroy() {
    plugin.off('ammo:change', this.id);
    plugin.off('hotbar:select', this.id);
    plugin.off('weapon:fire', this.id);
    var el = document.getElementById('ui-ammo');
    if (el) el.remove();
    plugin.removeStyles(this.id);
  }
});
