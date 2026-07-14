// ============================================================
// ÖRNEK PLUGIN: Aura Pulse
// 
// Ne öğretir:
//   - Oyuncu 3D modeline dinamik nesne ekleme (aura halkası)
//   - Oyuncu rengini can durumuna göre değiştirme
//   - render2d ile özel UI çizimi
//   - Hook'larla event yakalama (player:hit, zombie:die)
//   - Kendi özel mantığını update döngüsüne ekleme
//
// Aktif edince göreceklerin:
//   - Karakterin etrafında dönen halka
//   - Can azaldıkça karakter kızarır
//   - Ekranın üstünde can çubuğuna ek olarak aura bar
//   - Zombi öldürünce halka parlar
// ============================================================

PluginRegistry.register({
  id: 'fx_aura_pulse',
  name: 'Aura Pulse',
  type: 'graphics',
  version: '1.0',
  description: 'Karaktere aura halkası + renk değişimi + özel UI',
  enabled: true,
  priority: 20,

  // ---------- Özel değişkenler ----------
  ring: null,
  ringAngle: 0,
  pulseIntensity: 0,

  init(game) {
    this.game = game;
    this.pulseIntensity = 0;

    // 1) 3D sahneye geometrik nesne ekleme (aura halkası)
    const ringGeo = new THREE.TorusGeometry(0.8, 0.04, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x4fc3f7,
      emissive: 0x4fc3f7,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.ring.rotation.x = Math.PI / 2;  // yatay düzlemde
    this.ring.position.y = 0.05;
    game.scene.add(this.ring);

    // 2) Hook dinleme: oyuncu hasar alınca renk değiştir
    PluginRegistry.on('player:hit', 'fx_aura_pulse', function(data) {
      const player = data.player;
      if (!player || !player.bodyMat) return;
      // Can azaldıkça rengi kırmızıya kaydır
      const ratio = player.hp / player.maxHp;
      const r = Math.round(79 + (244 - 79) * (1 - ratio));    // 0x4f → 0xf4
      const g = Math.round(195 - 195 * (1 - ratio));          // 0xc3 → 0x00
      const b = Math.round(247 - 247 * (1 - ratio));          // 0xf7 → 0x00
      player.bodyMat.color.setRGB(r / 255, g / 255, b / 255);

      // Aura da renk değiştirsin
      this.ring.material.color.setRGB(r / 255, g / 255, b / 255);
      this.ring.material.emissive.setRGB(r / 255, g / 255, b / 255);

      // Hasar alınca halka parlasın
      this.pulseIntensity = 1;
    }.bind(this));

    // Zombi öldürünce de parlasın
    PluginRegistry.on('zombie:die', 'fx_aura_pulse', function() {
      this.pulseIntensity = 1;
    }.bind(this));
  },

  // ---------- Her frame çalışır ----------
  update(dt) {
    if (!this.ring || !this.game.player) return;

    // Halka oyuncuyu takip etsin
    const playerMesh = this.game.playerMesh;
    if (playerMesh) {
      this.ring.position.x = playerMesh.position.x;
      this.ring.position.z = playerMesh.position.z;
    }

    // Halka dönsün
    this.ringAngle += dt * 1.5;
    this.ring.rotation.z = this.ringAngle;

    // Pulse efekti (ölçek + opaklık)
    if (this.pulseIntensity > 0) {
      this.pulseIntensity -= dt * 3;
      const p = Math.max(0, this.pulseIntensity);
      this.ring.scale.setScalar(1 + p * 0.3);
      this.ring.material.opacity = 0.4 + p * 0.6;
      this.ring.material.emissiveIntensity = 0.3 + p * 1.5;
    } else {
      this.ring.scale.setScalar(1);
      this.ring.material.opacity = 0.7;
      this.ring.material.emissiveIntensity = 0.3;
    }
  },

  // ---------- 2D özel UI (overlay) ----------
  render2d(ctx, w, h) {
    if (!this.game.player) return;

    const player = this.game.player;
    const ratio = player.hp / player.maxHp;

    // Aura bar (can çubuğunun altında)
    const barW = 200, barH = 4;
    const bx = (w - barW) / 2;
    const by = 32;

    ctx.save();
    // Arka plan
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(bx, by, barW, barH);

    // Dolu kısım — cana göre renkli
    const hue = 200 + (1 - ratio) * 40;  // maviden kırmızıya
    ctx.fillStyle = 'hsla(' + hue + ',80%,60%,0.7)';
    ctx.fillRect(bx, by, barW * ratio, barH);

    // Pulse anında parıltı
    if (this.pulseIntensity > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (this.pulseIntensity * 0.3) + ')';
      ctx.fillRect(bx + barW * ratio - 10, by - 2, 20, barH + 4);
    }

    ctx.restore();
  },

  // ---------- Temizlik ----------
  destroy() {
    if (this.ring && this.game) {
      this.game.scene.remove(this.ring);
    }
  }
});
