window.PluginCommandsAPI = (function() {
  var _commands = {};

  return {
    register: function(pluginId, commandName, handler, description) {
      var key = pluginId + ':' + commandName;
      if (_commands[key]) return;
      _commands[key] = { pluginId: pluginId, commandName: commandName, handler: handler, description: description || '' };
    },

    unregister: function(pluginId, commandName) {
      delete _commands[pluginId + ':' + commandName];
    },

    unregisterAll: function(pluginId) {
      for (var key in _commands) {
        if (key.indexOf(pluginId + ':') === 0) delete _commands[key];
      }
    },

    execute: function(input) {
      var trimmed = input.trim();
      if (!trimmed) return { success: false, output: '' };
      var parts = [];
      var current = '';
      var inQuote = false;
      for (var i = 0; i < trimmed.length; i++) {
        var ch = trimmed[i];
        if (ch === '"') { inQuote = !inQuote; continue; }
        if (ch === ' ' && !inQuote) { if (current) { parts.push(current); current = ''; } continue; }
        current += ch;
      }
      if (current) parts.push(current);
      var cmd = parts[0];
      var args = parts.slice(1);

      var key = _commands[cmd];
      if (key) {
        try {
          var result = key.handler(args);
          return { success: true, output: result !== undefined && result !== null ? String(result) : '' };
        } catch (e) {
          return { success: false, output: e.message || String(e) };
        }
      }
      for (var k in _commands) {
        if (k === cmd || k.indexOf(cmd + ':') === 0 || _commands[k].commandName === cmd) {
          try {
            var result = _commands[k].handler(args);
            return { success: true, output: result !== undefined && result !== null ? String(result) : '' };
          } catch (e) {
            return { success: false, output: e.message || String(e) };
          }
        }
      }
      return { success: false, output: 'Bilinmeyen komut: ' + cmd };
    },

    get: function(pluginId, commandName) {
      return _commands[pluginId + ':' + commandName] || null;
    },

    getAll: function() {
      var list = [];
      for (var key in _commands) list.push(_commands[key]);
      return list;
    },

    getByPlugin: function(pluginId) {
      var list = [];
      for (var key in _commands) {
        if (key.indexOf(pluginId + ':') === 0) list.push(_commands[key]);
      }
      return list;
    }
  };
})();
