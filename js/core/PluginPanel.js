// Plugin Panel UI
(function() {
  var panel, list, countEl;

  function storageKey() { return 'zombie3d_plugin_states'; }

  function loadStates() {
    try { return JSON.parse(localStorage.getItem(storageKey())) || {}; } catch(e) { return {}; }
  }

  function saveState(id, enabled) {
    var states = loadStates();
    states[id] = enabled;
    localStorage.setItem(storageKey(), JSON.stringify(states));
  }

  function removeState(id) {
    var states = loadStates();
    delete states[id];
    localStorage.setItem(storageKey(), JSON.stringify(states));
  }

  document.addEventListener('DOMContentLoaded', function() {
    panel = document.getElementById('pluginPanel');
    list = document.getElementById('pluginList');

    var toggle = document.getElementById('panelToggle');
    var close = document.getElementById('panelClose');

    // Header — sağ üst sayacı ekle
    var header = document.getElementById('panelHeader');
    countEl = document.createElement('span');
    countEl.style.cssText = 'font-size:10px;color:rgba(255,255,255,0.3);margin-left:auto;letter-spacing:0.5px;';
    header.insertBefore(countEl, close);

    // Grup başlıklarını ekle
    renderGroups();

    toggle.addEventListener('click', function() {
      panel.classList.toggle('open');
    });
    close.addEventListener('click', function() {
      panel.classList.remove('open');
    });

    updateCount();
    if (window.PluginRegistry) {
      PluginRegistry.getAll().forEach(function(p) {
        addCard(p);
      });
    }
  });

  var typeLabels = {
    core: 'Çekirdek',
    map: 'Harita',
    player: 'Oyuncu',
    weapon: 'Silah',
    enemy: 'Düşman',
    graphics: 'Grafik',
    ui: 'Arayüz',
    menu: 'Menü',
    scene: 'Sahne'
  };

  function groupKey(p) {
    return typeLabels[p.type] || p.type || 'Diğer';
  }

  var groups;

  function renderGroups() {
    groups = {};
    list.innerHTML = '';
  }

  function getOrCreateGroup(label) {
    if (groups[label]) return groups[label];
    var g = document.createElement('div');
    g.className = 'plugin-group';

    var h = document.createElement('div');
    h.className = 'plugin-group-header';
    h.textContent = label;
    g.appendChild(h);

    var c = document.createElement('div');
    c.className = 'plugin-group-content';
    g.appendChild(c);

    list.appendChild(g);
    groups[label] = c;
    return c;
  }

  function updateCount() {
    if (!countEl || !window.PluginRegistry) return;
    var all = PluginRegistry.getAll();
    var active = all.filter(function(p) { return p.enabled; }).length;
    countEl.textContent = active + ' / ' + all.length + ' aktif';
  }

  window.PluginPanel = {
    addCard: function(plugin) {
      if (!list) return;
      var container = getOrCreateGroup(groupKey(plugin));

      var card = document.createElement('div');
      card.className = 'plugin-card';
      card.dataset.pluginId = plugin.id;

      var info = document.createElement('div');
      info.className = 'info';

      var nameRow = document.createElement('div');
      nameRow.className = 'name-row';
      nameRow.innerHTML = '<span class="name">' + plugin.name + '</span>' +
        '<span class="version">v' + (plugin.version || '1.0') + '</span>';

      var desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = plugin.description || '';

      info.appendChild(nameRow);
      info.appendChild(desc);

      var togg = document.createElement('label');
      togg.className = 'switch' + (plugin.enabled ? ' active' : '');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = plugin.enabled;
      cb.addEventListener('change', function() {
        PluginRegistry.toggle(plugin.id);
        togg.classList.toggle('active');
        card.classList.toggle('disabled');
        saveState(plugin.id, plugin.enabled);
        updateCount();
      });
      var slider = document.createElement('span');
      slider.className = 'slider';
      togg.appendChild(cb);
      togg.appendChild(slider);

      card.appendChild(info);
      card.appendChild(togg);
      if (!plugin.enabled) card.classList.add('disabled');
      container.appendChild(card);
      updateCount();
    }
  };
})();
