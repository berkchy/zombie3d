window.PluginRegistry = (function() {
  var _plugins = new Map();
  var _hookChains = {};

  return {
    // ---------- Kayıt ----------
    register: function(plugin) {
      if (!plugin.id) { console.warn('Plugin id gerekli'); return; }
      if (_plugins.has(plugin.id)) {
        console.warn('Plugin "' + plugin.id + '" zaten kayıtlı');
        return;
      }
      plugin.enabled = plugin.enabled !== false;
      plugin.priority = plugin.priority || 0;
      plugin._loaded = false;

      // localStorage'dan kayıtlı durumu varsa uygula
      try {
        var stored = JSON.parse(localStorage.getItem('zombie3d_plugin_states') || '{}');
        if (stored[plugin.id] !== undefined) {
          plugin.enabled = stored[plugin.id];
        }
      } catch(e) {}

      // Ini yolunu script elementinden oku
      var script = document.currentScript;
      if (script && script.getAttribute) {
        var iniPath = script.getAttribute('data-ini-path');
        if (iniPath) plugin._iniPath = iniPath;
      }

      // Debug flag — script elementinden oku
      if (script && script.getAttribute && script.getAttribute('data-debug') === 'true') {
        plugin._debug = true;
      }

      // log() helper — debug aktifse konsola [pluginId] ile yazar
      if (plugin._debug) {
        plugin.log = function() {
          var args = ['[' + plugin.id + ']'];
          for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
          console.log.apply(console, args);
        };
      } else {
        plugin.log = function() {};
      }

      _plugins.set(plugin.id, plugin);
      console.log('[Plugin] ' + plugin.id + ' (' + (plugin.type || 'generic') + ') kaydedildi');

      // Stil enjekte et
      if (plugin.styles) {
        this._injectStyles(plugin.id, plugin.styles);
      }

      if (window.PluginPanel && window.PluginPanel.addCard) {
        window.PluginPanel.addCard(plugin);
      }
    },

    // ---------- Stil Yönetimi ----------
    _injectStyles: function(id, styles) {
      var existing = document.getElementById('plugin-style-' + id);
      if (existing) return;
      var style = document.createElement('style');
      style.id = 'plugin-style-' + id;
      style.textContent = typeof styles === 'function' ? styles() : styles;
      document.head.appendChild(style);
    },

    removeStyles: function(id) {
      var el = document.getElementById('plugin-style-' + id);
      if (el) el.remove();
    },

    // ---------- Sorgulama ----------
    get: function(id) {
      var p = _plugins.get(id);
      if (!p) return undefined;
      if (!p.enabled) {
        var _safe = ['id', 'enabled', 'type', 'name', 'version', 'description', 'priority', '_iniPath', '_loaded', '_debug', 'toJSON'];
        return new Proxy(p, {
          get: function(target, prop) {
            if (_safe.indexOf(prop) !== -1) {
              return prop === 'enabled' ? false : target[prop];
            }
            if (typeof prop === 'string' && prop.indexOf('_') !== 0) {
              return function() { throw new TypeError(prop + ' is not a function'); };
            }
            return target[prop];
          }
        });
      }
      return p;
    },
    getAll: function() { return Array.from(_plugins.values()); },
    getEnabled: function() {
      return Array.from(_plugins.values()).filter(function(p) { return p.enabled; });
    },
    getByType: function(type) {
      return Array.from(_plugins.values())
        .filter(function(p) { return p.type === type && p.enabled; })
        .sort(function(a, b) { return (a.priority || 0) - (b.priority || 0); });
    },

    // ---------- Aç/Kapa ----------
    enable: function(id) {
      var p = _plugins.get(id);
      if (!p) return;
      p.enabled = true;
      if (p.onEnable) p.onEnable();
      if (window.Game && p._loaded && p.init) p.init(window.Game);
    },

    disable: function(id) {
      var p = _plugins.get(id);
      if (!p) return;
      p.enabled = false;
      if (p.onDisable) p.onDisable();
    },

    toggle: function(id) {
      var p = _plugins.get(id);
      if (!p) return;
      if (p.enabled) this.disable(id); else this.enable(id);
    },

    // ---------- Hook Sistemi ----------
    on: function(hook, pluginId, fn) {
      if (!_hookChains[hook]) _hookChains[hook] = [];
      _hookChains[hook].push({ pluginId: pluginId, fn: fn });
    },

    off: function(hook, pluginId) {
      var chain = _hookChains[hook];
      if (!chain) return;
      _hookChains[hook] = chain.filter(function(entry) {
        return entry.pluginId !== pluginId;
      });
    },

    emit: function(hook) {
      var chain = _hookChains[hook];
      if (!chain) return;
      var args = Array.prototype.slice.call(arguments, 1);
      chain.forEach(function(entry) {
        var p = _plugins.get(entry.pluginId);
        if (p === undefined || p.enabled) entry.fn.apply(null, args);
      });
    }
  };
})();
