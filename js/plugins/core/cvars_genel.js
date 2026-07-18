var plugin = window.include('registry');
var cvar = window.include('cvar');

plugin.register({
  id: 'cvars_genel',
  name: 'Genel Cvar\'lar',
  type: 'core',
  version: '1.1',
  description: 'Sistem genelinde kullan\u0131lan cvar\'lar (sensitivity, fov, vs.)',
  enabled: true,
  priority: -500,

  init(game) {
    cvar.register('sensitivity',        1.0,    'number',  'Fare hassasiyeti carpan\u0131 (0.1 - 5.0)');
    cvar.register('camera_fov',         60,     'number',  'Yatay g\u00f6r\u00fc\u015f a\u00e7\u0131s\u0131 (40 - 120)');
    cvar.register('invert_y',           false,  'boolean', 'Fare Y eksenini ters \u00e7evir');

    cvar.register('master_volume',      1.0,    'number',  'Ses seviyesi (0.0 - 1.0)');
    cvar.register('lang',               'tr',   'string',  'Dil kodu (tr, en, de)');
    cvar.register('fps_counter',        false,  'boolean', 'FPS g\u00f6stergesini a\u00e7/kapa');
    cvar.register('autoreload',         true,   'boolean', 'Bo\u015f \u015farj\u00f6rde otomatik reload');
    cvar.register('viewmodel_bobbing',  true,   'boolean', 'Silah sallanma efekti');

    // === onChange handlers ===

    // camera_fov: yatay FOV sabitleme
    cvar.onChange('camera_fov', function(val) {
      if (typeof _targetHfov !== 'undefined') _targetHfov = val;
      if (typeof _applyHfov === 'function') _applyHfov();
    });

    // fps_counter: DOM göstergesi aç/kapa
    cvar.onChange('fps_counter', function(val) {
      var el = document.getElementById('fps-counter');
      if (el) el.style.display = val ? 'block' : 'none';
    });

    // lang: değiştiğinde konsola bildir (ileride i18n)
    cvar.onChange('lang', function(val) {
      console.log('[cvars] Dil değiştirildi: ' + val + ' (i18n hen\u00fcz implemente edilmedi)');
    });

    // master_volume: ileride ses sistemi
    cvar.onChange('master_volume', function(val) {
      console.log('[cvars] Ses seviyesi: ' + val);
    });

    // FPS counter DOM elemanını oluştur
    if (!document.getElementById('fps-counter')) {
      var el = document.createElement('div');
      el.id = 'fps-counter';
      el.style.cssText = 'position:fixed;top:8px;right:10px;color:#4fc3f7;font-family:monospace;font-size:12px;z-index:300;pointer-events:none;display:none;text-shadow:0 0 4px rgba(0,0,0,.8);';
      el.textContent = 'FPS: --';
      document.body.appendChild(el);
    }

  }
});
