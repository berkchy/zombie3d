PluginRegistry.register({
  id: 'cvars_genel',
  name: 'Genel Cvar\'lar',
  type: 'core',
  version: '1.1',
  description: 'Sistem genelinde kullan\u0131lan cvar\'lar (sensitivity, fov, vs.)',
  enabled: true,
  priority: -500,

  init(game) {
    PluginCvarAPI.register('sensitivity',       1.0,    'number',  'Fare hassasiyeti carpan\u0131 (0.1 - 5.0)');
    PluginCvarAPI.register('camera_fov',         75,     'number',  'Kamera g\u00f6r\u00fc\u015f a\u00e7\u0131s\u0131 (30 - 120)');
    PluginCvarAPI.register('invert_y',           false,  'boolean', 'Fare Y eksenini ters \u00e7evir');
    PluginCvarAPI.register('crosshair_size',     1.0,    'number',  'Ni\u015fangah boyutu (0.5 - 3.0)');
    PluginCvarAPI.register('master_volume',      1.0,    'number',  'Ses seviyesi (0.0 - 1.0)');
    PluginCvarAPI.register('lang',               'tr',   'string',  'Dil kodu (tr, en, de)');
    PluginCvarAPI.register('fps_counter',        false,  'boolean', 'FPS g\u00f6stergesini a\u00e7/kapa');
    PluginCvarAPI.register('autoreload',         true,   'boolean', 'Bo\u015f \u015farj\u00f6rde otomatik reload');
    PluginCvarAPI.register('viewmodel_bobbing',  true,   'boolean', 'Silah sallanma efekti');

    // === onChange handlers ===

    // camera_fov: uygula
    PluginCvarAPI.onChange('camera_fov', function(val) {
      var cam = window.camera;
      if (cam) { cam.fov = val; cam.updateProjectionMatrix(); }
    });

    // crosshair_size: DOM'daki nişangah boyutu
    PluginCvarAPI.onChange('crosshair_size', function(val) {
      var ch = document.getElementById('crosshair');
      if (ch) ch.style.fontSize = (30 * val) + 'px';
    });

    // fps_counter: DOM göstergesi aç/kapa
    PluginCvarAPI.onChange('fps_counter', function(val) {
      var el = document.getElementById('fps-counter');
      if (el) el.style.display = val ? 'block' : 'none';
    });

    // lang: değiştiğinde konsola bildir (ileride i18n)
    PluginCvarAPI.onChange('lang', function(val) {
      console.log('[cvars] Dil değiştirildi: ' + val + ' (i18n hen\u00fcz implemente edilmedi)');
    });

    // master_volume: ileride ses sistemi
    PluginCvarAPI.onChange('master_volume', function(val) {
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

    // Crosshair başlangıç boyutunu uygula
    var ch = document.getElementById('crosshair');
    if (ch) ch.style.fontSize = (30 * PluginCvarAPI.get('crosshair_size')) + 'px';
  }
});
