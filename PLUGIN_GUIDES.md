# Zombie Survivor 3D — Eklenti Geliştirme Kılavuzu

## İçindekiler
1. [Giriş](#giriş)
2. [Temel Plugin Yapısı](#temel-plugin-yapısı)
3. [Plugin Tipleri](#plugin-tipleri)
4. [Yaşam Döngüsü](#yaşam-döngüsü)
5. [Hook Sistemi (Olaylar)](#hook-sistemi-olaylar)
6. [Oyun Nesnesine Erişim](#oyun-nesnesine-erişim)
7. [3D Nesne Ekleme](#3d-nesne-ekleme)
8. [2D Overlay Çizimi](#2d-overlay-çizimi)
9. [Tam Örnek](#tam-örnek)
10. [İpuçları](#ipuçları)

---

## Giriş

Her plugin kendi `.js` dosyasıdır ve `PluginRegistry.register()` ile sisteme kaydolur.  
Dosyalar `js/plugins/` dizinine konur ve `plugins.ini` dosyasına yolu eklenir.

**Kayıt:**
```javascript
PluginRegistry.register({
  id: 'benim_eklentim',
  name: 'Benim Eklentim',
  type: 'core',
  version: '1.0',
  description: 'Ne işe yaradığını anlat',
  enabled: true,
  ...
});
```

**Aktifleştirme:**  
`plugins.ini` dosyasına bir satır ekle:

```
# plugins.ini
js/plugins/benim_eklentim.js
```

### Debug Flag

plugins.ini'de satır sonuna `debug` yazarsan, o plugin için `this.log()` aktif olur ve konsola `[pluginId]` etiketiyle mesaj basar:

```
# plugins.ini
js/plugins/deneme_eklentim.js debug
```

Sonra plugin içinde:
```javascript
init(game) {
  this.log('init çağrıldı');  // Konsola: [deneme_eklentim] init çağrıldı
}
```

Normalde `this.log()` sessizdir (noop). Sadece `debug` flag'i verilen pluginlerde konsola yazar.

---

## Temel Plugin Yapısı

```javascript
PluginRegistry.register({

  // ---------- ZORUNLU ALANLAR ----------
  id: 'ornek_plugin',         // Benzersiz kimlik
  name: 'Örnek Plugin',       // İnsan tarafından okunabilir isim
  type: 'core',               // Plugin tipi (aşağıya bak)
  version: '1.0',             // Versiyon numarası

  // ---------- OPSİYONEL ALANLAR ----------
  description: 'Açıklama',    // Ne işe yaradığı
  enabled: true,              // Başlangıçta aktif mi (varsayılan: true)
  priority: 0,                // Çalışma önceliği (küçük = önce çalışır)

  // ---------- ÖZEL DEĞİŞKENLER ----------
  game: null,                 // init()'te doldurulur
  sayac: 0,                   // Kendi değişkenlerin

  // ---------- YAŞAM DÖNGÜSÜ ----------
  init(game) {
    // Oyun başladığında çağrılır
    // Burada 3D nesneleri oluştur, hook'ları dinle
  },

  update(dt) {
    // Her frame çağrılır (dt = saniye cinsinden delta time)
  },

  render2d(ctx, w, h) {
    // 2D overlay canvas'a çizim yapmak için
    // ctx: CanvasRenderingContext2D
    // w, h: canvas genişliği ve yüksekliği
  },

  destroy() {
    // Plugin kaldırılırken temizlik
  },

  // ---------- AÇ/KAPA OLAYLARI ----------
  onEnable() {
    // Plugin panelden aktifleştirilince
  },

  onDisable() {
    // Plugin panelden devre dışı bırakılınca
  },

  // ---------- STİLLER ----------
  styles: '#plugin-foo-bar{color:red;}'   // CSS string
  // veya:
  styles: function() { return '#plugin-foo-bar{color:red;}'; }  // CSS döndüren fonksiyon
});
```

---

## Plugin Tipleri

| Tip         | Öncelik | Kullanım                                      |
|-------------|---------|-----------------------------------------------|
| `core`      | 0       | Oyun mantığı, combo sistemleri, modifikasyon  |
| `map`       | 1       | Harita, zemin, duvar, ışıklandırma            |
| `player`    | 2       | Oyuncu modeli, kontroller, fizik              |
| `weapon`    | 3       | Silah tipleri, mermi, hasar                   |
| `enemy`     | 4       | Düşman tipleri, yapay zeka                     |
| `pickup`    | 4       | Toplanabilir nesneler (XP, can, vb.)          |
| `graphics`  | 5       | Görsel efektler, parçacıklar, ışık            |
| `ui`        | 6       | HUD göstergeleri, özel arayüz elemanları      |
| `menu`      | 7       | Menü ekranları                                |
| `scene`     | 8       | Geçiş sahneleri, intro animasyonları           |

Öncelik sırası hangi pluginin önce `init()` ve `update()` çağrılacağını belirler.  
Aynı tip içindeki sıra `priority` alanına göre belirlenir (küçük → önce).

---

## Yaşam Döngüsü

```
Oyun başlar
  │
  ├─ PluginLoader plugins.ini'yi okur
  ├─ Her plugin için <script> tag'i oluşturulur
  │   └─ Her plugin PluginRegistry.register() çağırır
  │
  ├─ main.js: reloadPlugins()
  │   └─ Sıralı olarak her pluginin init(game) çağrılır
  │
  ├─ [Menü] → [Intro] → oyun başlar
  │
  ├─ Her frame:
  │   ├─ Her pluginin update(dt) çağrılır
  │   ├─ Three.js 3D render
  │   └─ Her pluginin render2d(ctx, w, h) çağrılır
  │
  ├─ Oyun bittiğinde:
  │   └─ destroy() çağrılır
  │
  └─ Yeniden başlatma:
      └─ destroy() → yeniden init()
```

---

## Hook Sistemi (Olaylar)

Pluginler birbirleriyle hook'lar üzerinden haberleşir.

### Dinleme (on)

```javascript
PluginRegistry.on('olay_adi', 'kendi_plugin_id', function(data) {
  // data olaya göre değişir
});
```

### Tetikleme (emit)

```javascript
PluginRegistry.emit('olay_adi', data1, data2, ...);
```

**Önemli:** `on()` çağrısı `init()` içinde yapılmalıdır.

### Yerleşik Olaylar

| Olay                              | Data                                   | Ne Zaman                     |
|-----------------------------------|----------------------------------------|------------------------------|
| `menu:play`                       | —                                      | Menüde "Oyunu Başlat" tıklanınca |
| `intro:done`                      | —                                      | Intro animasyonu bitince     |
| `game:start`                      | —                                      | Oyun başlayınca              |
| `game:over`                       | —                                      | Oyuncu ölünce                |
| `game:restart`                    | —                                      | Oyun yeniden başlayınca      |
| `game:loaded`                     | —                                      | Tüm pluginler yüklenince     |
| `game:tick`                       | `{ elapsed }`                          | Her saniye (gerçek zaman)    |
| `game:pause`                      | —                                      | Oyun duraklatılınca          |
| `game:resume`                     | —                                      | Oyun devam ettirilince       |
| `player:hit`                      | `{ player, damage, hp }`              | Oyuncu hasar alınca          |
| `player:heal`                     | `{ player, amount, hp }`              | Oyuncu can yenileyince       |
| `player:shoot`                    | `{ player }`                          | Oyuncu ateş edince           |
| `player:dodge`                    | `{ player }`                          | Oyuncu kaçış yapınca (Shift) |
| `player:moving`                   | `{ player, dx, dz, speed, position }` | Oyuncu hareket edince        |
| `player:aiming`                   | `{ player, angle, targetX, targetZ }` | Oyuncu nişan alınca          |
| `player:xp`                       | `{ player, xp, level }`               | XP kazanılınca               |
| `player:levelup`                  | `{ player, level }`                   | Seviye atlanınca             |
| `zombie:die`                      | `position` (THREE.Vector3)            | Zombi ölünce                 |
| `zombie:spawn`                    | `{ zombie, position, wave }`          | Zombi doğunca                |
| `zombie:hit`                      | `{ zombie, damage, hp, position }`    | Zombi hasar alınca           |
| `wave:change`                     | `{ oldWave, newWave }`                | Dalga değişince              |
| `score:change`                    | `{ score }`                           | Skor değişince               |
| `bullet:hit`                      | `{ position, bullet }`                | Mermi bir şeye çarpınca      |
| `weapon:fire`                     | `{ weapon, position, direction, ammo }`| Silah ateşlenince            |
| `ammo:change`                     | `{ ammo, maxAmmo }`                   | Mermi sayısı değişince       |
| `pickup:collect`                  | `{ xp? | heal?, position }`           | Item toplanınca              |

**Örnek — zombie ölünce patlama efekti:**
```javascript
PluginRegistry.on('zombie:die', 'benim_eklentim', function(pos) {
  this.patlat(pos);
}.bind(this));
```

---

## Oyun Nesnesine Erişim

`init(game)` ile alınan `game` nesnesi üzerinden her şeye erişilebilir:

```javascript
game.scene         // Three.js sahnesi
game.camera        // Three.js kamerası
game.renderer      // Three.js renderer
game.player        // Oyuncu plugin'i (varsa)
game.playerMesh    // Oyuncunun Three.js grubu
game.score         // Puan
game.elapsed       // Oynanan süre (saniye)
game.paused        // Oyun duraklatılmış mı
game.shoot(owner)  // Ateş etme fonksiyonu
game.gameOver()    // Oyunu bitir
game.restart()     // Oyunu yeniden başlat
game.togglePause() // Duraklat/devam et
```

**Player üzerinde değişiklik (modifikasyon pluginleri):**
```javascript
var player = PluginRegistry.get('player_basic');
if (player && player.enabled) {
  player.speed = 12;         // Hız 2 katına çıktı
  player.bodyScale = 1.5;    // Karakter büyüdü
  player.invincible = true;  // Ölümsüz
  player.color = 0xff0000;   // Renk kırmızı
  player.bodyMat.color.setHex(0xff0000);  // 3D model rengi
}
```

**Player metodları:**
```javascript
player.takeDamage(amount);   // Hasar ver
player.heal(amount);         // Can yenile
player.addXp(amount);        // XP ekle (level up otomatik)
```

**Weapon metodları:**
```javascript
var weapon = PluginRegistry.get('weapon_pistol');
if (weapon && weapon.enabled) {
  weapon.addAmmo(amount);    // Mermi ekle
}
```

---

## 3D Nesne Ekleme

Three.js geometrileri doğrudan sahneye eklenebilir:

```javascript
init(game) {
  this.game = game;

  // Küre
  var geo = new THREE.SphereGeometry(0.5, 16, 16);
  var mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xff4400 });
  this.mesh = new THREE.Mesh(geo, mat);
  this.mesh.position.set(0, 1, 0);
  game.scene.add(this.mesh);
},

update(dt) {
  if (this.mesh) {
    this.mesh.rotation.y += dt;    // Döndür
    this.mesh.position.y = 1 + Math.sin(Date.now() * 0.003) * 0.3;  // Zıplat
  }
},

  destroy() {
    if (this.mesh && this.game) {
      this.game.scene.remove(this.mesh);
    }
    // Plugin stillerini temizlemeyi unutma
    PluginRegistry.removeStyles(this.id);
  }
```

---

## 2D Overlay Çizimi

`render2d(ctx, w, h)` ile canvas API'sini kullanarak HUD, metin, çizgiler ekleyebilirsin:

```javascript
render2d(ctx, w, h) {
  ctx.save();

  // Metin
  ctx.font = 'bold 24px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText('Merhaba', w / 2, 50);

  // Dikdörtgen
  ctx.fillStyle = 'rgba(255,0,0,0.3)';
  ctx.fillRect(10, 10, 200, 20);

  // Çizgi
  ctx.strokeStyle = '#ff0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  ctx.restore();
}
```

---

## Tam Örnek

**Zombi öldürünce oyuncunun boyutunu büyüten bir plugin:**

```javascript
// js/plugins/orn_buyume.js
PluginRegistry.register({
  id: 'orn_buyume',
  name: 'Büyüme Efekti',
  type: 'core',
  version: '1.0',
  description: 'Zombi öldürdükçe oyuncu büyür',
  enabled: true,

  init(game) {
    // Zombi ölünce boyut artır
    PluginRegistry.on('zombie:die', 'orn_buyume', function() {
      var p = PluginRegistry.get('player_basic');
      if (p && p.enabled) {
        p.bodyScale = Math.min(p.bodyScale + 0.05, 2.5);
      }
    });
  },

  render2d(ctx, w, h) {
    var p = PluginRegistry.get('player_basic');
    if (!p || !p.enabled) return;
    // Boyut göstergesi
    ctx.save();
    ctx.font = '12px Segoe UI';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'right';
    ctx.fillText('Boyut: ' + p.bodyScale.toFixed(2) + 'x', w - 20, 30);
    ctx.restore();
  },

  destroy() {
    var p = PluginRegistry.get('player_basic');
    if (p) p.bodyScale = 1;
    PluginRegistry.removeStyles(this.id);
  }
});
```

**plugins.ini'ye ekle:**
```
js/plugins/orn_buyume.js
```

---

## Stil Yönetimi (styles)

Pluginler CSS stillerini doğrudan `styles` alanı ile tanımlayabilir. Bu stiller otomatik olarak `<head>` içine enjekte edilir ve plugin `destroy()` olunca temizlenir.

```javascript
PluginRegistry.register({
  id: 'ornek_stil',
  name: 'Stil Örneği',
  type: 'ui',
  styles: '.ornek-kutu{background:rgba(255,0,0,0.5);padding:10px;border-radius:4px;color:#fff;}',

  init(game) {
    var div = document.createElement('div');
    div.className = 'ornek-kutu';
    div.textContent = 'Stilli kutu';
    document.body.appendChild(div);
    this.el = div;
  },

  destroy() {
    if (this.el) this.el.remove();
    PluginRegistry.removeStyles(this.id);
  }
});
```

**Notlar:**
- `styles` string veya CSS döndüren bir fonksiyon olabilir
- `<style id="plugin-style-{id}">` olarak eklenir
- Aynı id'ye sahip ikinci bir stil eklenmez (çakışma önlenir)
- `destroy()` içinde `PluginRegistry.removeStyles(this.id)` çağırmayı unutma

---

## İpuçları

- **Performans:** `render2d` her frame çağrılır, ağır işlemler yapma
- **Three.js:** Tüm Three.js API'sine erişimin var. Mesh, Light, ParticleSystem ekleyebilirsin
- **Overlay:** `render2d` canvas API'siyle çalışır, `ctx.save()/restore()` kullanmayı unutma
- **Hook:** Aynı olaya birden fazla plugin dinleyici ekleyebilir
- **Hata yakalama:** Plugin `init` hatası tüm oyunu çökertmez, sadece o plugin çalışmaz
- **Panel:** Plugin panelinde her plugin görünür ve toggle ile açılıp kapanabilir
- **Güvenlik:** Diğer pluginlerin değişkenlerine doğrudan erişebilirsin, dikkatli ol
- **ES5+:** Pluginler ES5+ sentaksıyla yazılmalıdır (import/export yok)
- **Kendini tekrar kaydetme:** Her plugin `register()`'ı yalnızca bir kez çağırmalıdır
