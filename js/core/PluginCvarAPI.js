window.PluginCvarAPI = (function() {
  var _cvars = {};
  var LS_PREFIX = 'cvar_';

  function _loadSaved(id, fallback) {
    try {
      var raw = localStorage.getItem(LS_PREFIX + id);
      if (raw !== null) return JSON.parse(raw);
    } catch(e) {}
    return fallback;
  }

  function _save(id, value) {
    try { localStorage.setItem(LS_PREFIX + id, JSON.stringify(value)); } catch(e) {}
  }

  function _remove(id) {
    try { localStorage.removeItem(LS_PREFIX + id); } catch(e) {}
  }

  function validate(cvar, rawValue) {
    switch (cvar.type) {
      case 'number': {
        if (typeof rawValue === 'number' && !isNaN(rawValue)) return null;
        if (typeof rawValue === 'string' && rawValue.trim() !== '') {
          var n = parseFloat(rawValue);
          if (!isNaN(n)) return null;
        }
        return 'Hata: ' + cvar.id + ' bir say\u0131 olmal\u0131';
      }
      case 'boolean': {
        if (typeof rawValue === 'boolean') return null;
        var low = String(rawValue).toLowerCase().trim();
        if (['true', 'false', '1', '0', 'yes', 'no'].indexOf(low) !== -1) return null;
        return 'Hata: ' + cvar.id + ' true/false olmal\u0131';
      }
      case 'string':
        return null;
    }
    return null;
  }

  function convert(cvar, rawValue) {
    switch (cvar.type) {
      case 'number':
        return typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
      case 'boolean':
        if (typeof rawValue === 'boolean') return rawValue;
        var low = String(rawValue).toLowerCase().trim();
        return low === 'true' || low === '1' || low === 'yes';
      case 'string':
        return String(rawValue);
    }
    return rawValue;
  }

  return {
    register: function(id, defaultValue, type, description, options) {
      if (_cvars[id]) return;
      type = type || 'string';
      if (['string', 'number', 'boolean'].indexOf(type) === -1) return;
      _cvars[id] = {
        id: id,
        defaultValue: defaultValue,
        value: _loadSaved(id, defaultValue),
        type: type,
        description: description || '',
        options: options || {},
        _onChange: []
      };
    },

    get: function(id) {
      var c = _cvars[id];
      return c ? c.value : undefined;
    },

    set: function(id, rawValue) {
      var c = _cvars[id];
      if (!c) return { success: false, error: 'Cvar bulunamad\u0131: ' + id };
      var err = validate(c, rawValue);
      if (err) return { success: false, error: err };
      var old = c.value;
      c.value = convert(c, rawValue);
      _save(c.id, c.value);
      for (var i = 0; i < c._onChange.length; i++) {
        try { c._onChange[i](c.value, old); } catch(e) {}
      }
      return { success: true };
    },

    reset: function(id) {
      var c = _cvars[id];
      if (!c) return { success: false, error: 'Cvar bulunamad\u0131: ' + id };
      var old = c.value;
      c.value = c.defaultValue;
      _remove(c.id);
      for (var i = 0; i < c._onChange.length; i++) {
        try { c._onChange[i](c.value, old); } catch(e) {}
      }
      return { success: true };
    },

    getInfo: function(id) {
      var c = _cvars[id];
      if (!c) return null;
      return {
        id: c.id,
        value: c.value,
        defaultValue: c.defaultValue,
        type: c.type,
        description: c.description
      };
    },

    getAll: function() {
      var list = [];
      for (var key in _cvars) list.push(_cvars[key]);
      return list;
    },

    onChange: function(id, fn) {
      var c = _cvars[id];
      if (!c) return;
      c._onChange.push(fn);
    },

    offChange: function(id, fn) {
      var c = _cvars[id];
      if (!c) return;
      var idx = c._onChange.indexOf(fn);
      if (idx !== -1) c._onChange.splice(idx, 1);
    }
  };
})();
