var plugin = include('registry');
var commands = include('commands');

plugin.register({
  id: 'dev_zombies_cmd',
  name: 'Zombies Komutu',
  type: 'core',
  version: '1.0',
  description: 'zombies set/get/list — zombi verilerini okuma/değiştirme',

  init() {
    commands.register('dev_zombies_cmd', 'zombies', function(args) {
      if (args.length === 0) return 'Kullanım: zombies list / get / set / spawn basic/boss';

      var sub = args[0];

      if (sub === 'list') {
        var zb = plugin.get('zombie_basic');
        var boss = plugin.get('zombie_boss');
        var bzList = (zb && zb.enabled) ? zb.zombies : [];
        var bossZ = (boss && boss.enabled) ? boss.boss : null;
        var out = '';

        if (bzList.length > 0) {
          var z = bzList[0];
          out += 'Basic Zombi (x' + bzList.length + '):\n';
          out += '  hp=' + z.hp + '  maxHp=' + z.maxHp + '  speed=' + z.speed + '  damage=' + z.damage + '\n';
        } else {
          out += 'Basic Zombi: (yok)\n';
        }

        if (bossZ && bossZ.alive) {
          out += 'Boss:\n';
          out += '  hp=' + bossZ.hp + '  maxHp=' + bossZ.maxHp + '  speed=' + bossZ.speed + '  damage=' + bossZ.damage;
        } else {
          out += 'Boss: (yok)';
        }
        return out;
      }

      if (sub === 'get') {
        if (args.length < 2) return 'Kullanım: zombies get <prop>';
        var prop = args[1];
        var out = '';

        var zb = plugin.get('zombie_basic');
        var boss = plugin.get('zombie_boss');
        var bzList = (zb && zb.enabled) ? zb.zombies : [];
        if (bzList.length > 0) {
          out += 'basic: ' + bzList[0][prop] + ' (x' + bzList.length + ')\n';
        }

        var bossZ = (boss && boss.enabled) ? boss.boss : null;
        if (bossZ && bossZ.alive) {
          out += 'boss: ' + bossZ[prop];
        } else if (prop === 'speed' || prop === 'damage' || prop === 'maxHp') {
          out += 'boss: -';
        }
        return out || 'Zombi yok veya prop bulunamadı';
      }

      if (sub === 'set') {
        var target = 'basic';
        var prop, val;
        var start = 1;

        if (args[1] === 'boss') {
          target = 'boss';
          start = 2;
        }

        if (args.length < start + 2) return 'Kullanım: zombies set <prop> <value>  veya  zombies set boss <prop> <value>';
        prop = args[start];
        val = args[start + 1];

        var num = parseFloat(val);
        if (isNaN(num)) return 'Geçersiz sayı: ' + val;

        var setBasic = target === 'basic';
        var setBoss = target === 'boss';
        var changed = [];

        if (setBasic) {
          var zb = plugin.get('zombie_basic');
          if (zb && zb.enabled && zb.zombies.length > 0) {
            for (var i = 0; i < zb.zombies.length; i++) {
              zb.zombies[i][prop] = num;
            }
            changed.push('basic x' + zb.zombies.length);

            if (prop === 'speed') {
              for (var i = 0; i < zb.zombies.length; i++) {
                plugin.emit('movement:register', {
                  entityId: zb.zombies[i]._moveId,
                  mesh: zb.zombies[i].mesh,
                  speed: num,
                  radius: 0.3,
                  canMove: zb._canMove
                });
              }
            }
          } else {
            changed.push('basic (yok)');
          }
        }

        if (setBoss) {
          var boss = plugin.get('zombie_boss');
          if (boss && boss.enabled && boss.boss && boss.boss.alive) {
            boss.boss[prop] = num;
            changed.push('boss');

            if (prop === 'speed') {
              plugin.emit('movement:register', {
                entityId: 'boss',
                mesh: boss.boss.mesh,
                speed: num,
                radius: 0.6,
                canMove: true
              });
            }
          } else {
            changed.push('boss (yok)');
          }
        }

        return prop + ' = ' + num + ' (' + changed.join(', ') + ')';
      }

      if (sub === 'spawn') {
      if (args.length < 2) return 'Kullanım: zombies spawn basic <count> [hp] [speed] [damage]\n  zombies spawn boss [hp] [speed] [damage]';

      if (args[1] === 'basic') {
        var count = parseInt(args[2], 10);
        if (isNaN(count) || count < 1) return 'Geçersiz sayi: ' + (args[2] || '');
        var hp = parseFloat(args[3]) || 20;
        var speed = parseFloat(args[4]) || 2;
        var damage = parseFloat(args[5]) || 5;
        if (!game || !game.player || !game.player.mesh) return 'Oyuncu yok';

        plugin.emit('wave:spawn', {
          count: count, hp: hp, maxHp: hp, speed: speed, damage: damage,
          wave: 0, poligon: false
        });
        return count + ' adet basic zombi spawnlandi (hp=' + hp + ', speed=' + speed + ', damage=' + damage + ')';
      }

      if (args[1] === 'boss') {
        var bossPlugin = plugin.get('zombie_boss');
        if (bossPlugin && bossPlugin.boss && bossPlugin.boss.alive) return 'Boss zaten hayatta';
        var wave = parseInt(args[2]) || 1;
        plugin.emit('boss:spawn', { wave: wave });
        return 'Boss spawnlandi (wave=' + wave + ')';
      }

      return 'Bilinmeyen hedef: ' + args[1] + ' (basic/boss)';
    }

    return 'Bilinmeyen alt komut: ' + sub;
  }, 'Zombi yonetimi: list / get / set / spawn basic/boss');
  },

  destroy() {
    commands.unregisterAll('dev_zombies_cmd');
  }
});
