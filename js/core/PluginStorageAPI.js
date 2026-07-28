window.PluginStorageAPI = (function() {

  var _prefix = '';

  function _key(key) {
    return _prefix ? _prefix + ':' + key : key;
  }

  function _safe(fn) {
    try { return fn(); } catch(e) { return null; }
  }

  var api = {
    setPrefix: function(prefix) {
      _prefix = prefix || '';
    },

    get: function(key, fallback) {
      return _safe(function() {
        var raw = localStorage.getItem(_key(key));
        if (raw === null) return fallback;
        return JSON.parse(raw);
      }) || fallback;
    },

    set: function(key, value) {
      _safe(function() {
        localStorage.setItem(_key(key), JSON.stringify(value));
      });
    },

    remove: function(key) {
      _safe(function() {
        localStorage.removeItem(_key(key));
      });
    },

    has: function(key) {
      return _safe(function() {
        return localStorage.getItem(_key(key)) !== null;
      }) || false;
    },

    keys: function(prefix) {
      return _safe(function() {
        var out = [];
        var searchPrefix = _prefix ? _prefix + ':' : '';
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (!prefix || k.indexOf(searchPrefix + prefix) === 0) out.push(k);
        }
        return out;
      }) || [];
    },

    getAll: function() {
      return _safe(function() {
        var out = {};
        var searchPrefix = _prefix ? _prefix + ':' : '';
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (!searchPrefix || k.indexOf(searchPrefix) === 0) {
            var raw = localStorage.getItem(k);
            try { out[k] = JSON.parse(raw); } catch(e) { out[k] = raw; }
          }
        }
        return out;
      }) || {};
    }
  };

  window.store = api;
  return api;
})();

Engine.register('PluginStorageAPI', { name: 'Depolama API', type: 'core', description: 'localStorage tabanli key-value depolama' });
