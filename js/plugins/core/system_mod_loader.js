var plugin = window.include('registry');
var map = window.include('map');

plugin.register({
  id: 'system_mod_loader',
  name: 'Mod Yükleyici',
  type: 'core',
  version: '1.0',
  description: 'Harita modlarini tarar ve MapRegistry\'ye kaydeder',
  priority: -500,

  init: function(game) {
    // Mod klasöründeki harita tanım dosyalarını tara
    // Her mod bir .js dosyası olup PluginRegistry'ye harita olarak kaydolur
    // Şimdilik sadece tanımlı scene pluginlerini MapRegistry'ye ekler

    var scenePlugins = plugin.getAll().filter(function(p) {
      return p.type === 'scene' && p.enabled && typeof p.getMapConfig === 'function';
    });

    scenePlugins.forEach(function(p) {
      try {
        var cfg = p.getMapConfig();
        if (cfg && cfg.id) {
          cfg.scenePluginId = p.id;
          cfg.buildThumbnail = function(scene, cb) {
            if (typeof p.buildThumbnail === 'function') {
              p.buildThumbnail(scene, cb);
            } else {
              cb();
            }
          };
          map.register(cfg);
        }
      } catch (e) {
        console.warn('[ModLoader]', p.id, 'kayit hatasi:', e);
      }
    });
  }
});
