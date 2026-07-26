var plugin = include('registry');
var commands = include('commands');

plugin.register({
  id: 'test_menu',
  name: 'Menu Test',
  type: 'core',
  version: '1.0',
  enabled: true,
  priority: 0,

  _sel(data) {
    var text = data.ITEM_NAME;
    var id = data.ITEM_ID;
    try {
      var dc = plugin.get('ui_devconsole');
      if (dc && dc.log) dc.log('test_menu', 'Secildi: ' + text + ' (#' + id + ')');
    } catch(e) {}
    console.log('[test_menu] Secildi: ' + text + ' (#' + id + ')');
  },

  init() {
    var self = this;
    commands.register('test_menu', 'menu_test', function(args) {
      var mid = menu_create('TEST MENUSU', function(data) { self._sel(data); });
      self._lastMenu = mid;

      menu_additem('Silah Sec', 1);
      menu_additem('Cephane Al', 1);
      menu_additem('Zombi Cagir', 1);
      menu_additem('Harita Degistir', 1);
      menu_additem('Ayarlar', 0);
      menu_additem('Yardim', 1);
      menu_additem('Diger Secenekler', 1);
      menu_additem('Bonus Item', 1);

      menu_setprop(MENU_EXIT);
      menu_display(mid);
      return 'Menu acildi: ' + mid;
    }, 'Test menusu ac — 8 secenek, 2 sayfa');
  },

  update() {}
});
