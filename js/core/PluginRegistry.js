var include, getCoreModule;

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
      plugin.forceEnabled = plugin.forceEnabled || false;
      plugin.priority = plugin.priority || 0;
      plugin._loaded = false;

      try {
        var _stored = store.get('zombie3d_plugin_states', null);
        if (_stored && _stored[plugin.id] !== undefined) {
          plugin.enabled = _stored[plugin.id];
        }
      } catch(e) {}

      if (plugin.forceEnabled) {
        plugin.enabled = true;
      }

      var script = document.currentScript;
      if (script && script.getAttribute) {
        var iniPath = script.getAttribute('data-ini-path');
        if (iniPath) plugin._iniPath = iniPath;
      }

      if (script && script.getAttribute && script.getAttribute('data-debug') === 'true') {
        plugin._debug = true;
      }

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
      console.log('[Plugin] ' + plugin.id + ' (' + (plugin.type || 'generic') + ') kaydedildi' + (plugin.forceEnabled ? ' [forceEnabled]' : ''));

      if (plugin.styles) {
        this._injectStyles(plugin.id, plugin.styles);
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
      if (!p) {
        return new Proxy({ id: id, enabled: false, name: id, type: 'unknown', version: '0' }, {
          get: function(target, prop) {
            var safe = ['id', 'enabled', 'type', 'name', 'version', 'description', 'priority', '_iniPath', '_loaded', '_debug', 'toJSON'];
            if (safe.indexOf(prop) !== -1) {
              return prop === 'enabled' ? false : target[prop];
            }
            if (typeof prop === 'string' && prop.indexOf('_') !== 0) {
              return function() { throw new TypeError("Plugin '" + id + "' not found."); };
            }
            return target[prop];
          }
        });
      }
      if (!p.enabled) {
        var _safe = ['id', 'enabled', 'type', 'name', 'version', 'description', 'priority', '_iniPath', '_loaded', '_debug', 'toJSON'];
        return new Proxy(p, {
          get: function(target, prop) {
            if (_safe.indexOf(prop) !== -1) {
              return prop === 'enabled' ? false : target[prop];
            }
            if (typeof prop === 'string' && prop.indexOf('_') !== 0) {
              return function() { throw new TypeError("Plugin '" + target.id + "' is disabled."); };
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
      if (p.forceEnabled) {
        console.warn('[Plugin] "' + id + '" forceEnabled - zaten aktif');
        return;
      }
      p.enabled = true;
      if (p.onEnable) p.onEnable();
      if (window.Game && p._loaded && p.init) p.init(window.Game);
      this._persistState();
    },

    disable: function(id) {
      var p = _plugins.get(id);
      if (!p) return;
      if (p.forceEnabled) {
        console.warn('[Plugin] "' + id + '" forceEnabled olarak tanimlanmistir, disable edilemez');
        return;
      }
      p.enabled = false;
      if (p.onDisable) p.onDisable();
      this._persistState();
    },

    toggle: function(id) {
      var p = _plugins.get(id);
      if (!p) return;
      if (p.forceEnabled) {
        console.warn('[Plugin] "' + id + '" forceEnabled, toggle yapilamaz');
        return;
      }
      if (p.enabled) this.disable(id); else this.enable(id);
    },

    _persistState: function() {
      try {
        var state = {};
        _plugins.forEach(function(p) {
          state[p.id] = p.enabled;
        });
        store.set('zombie3d_plugin_states', state);
      } catch(e) {}
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

    clearAllHooks: function() {
      _hookChains = {};
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

getCoreModule = function(name) {
  switch (name) {
    case 'registry': return window.PluginRegistry;
    case 'cvar': return window.PluginCvarAPI || null;
    case 'loader': return window.PluginLoader || null;
    case 'commands': return window.PluginCommandsAPI || null;
    case 'map': return window.MapRegistry || null;
    case 'game': return window.Game || window.game || null;
    case 'confirm_dialog': return window.ConfirmDialog || null;
    default: return null;
  }
};

include = function(name) {
  return getCoreModule(name);
};

Engine.register('PluginRegistry', { name: 'Plugin Kayıt Sistemi', type: 'core', version: '1.0', description: 'Plugin kayit, sorgulama ve hook altyapisi' });
