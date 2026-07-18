var plugin = include('registry');

plugin.register({
  id: 'test_hata',
  name: 'Hata Test',
  type: 'core',
  version: '1.0',
  description: 'Debug/hata yakalama testi',
  enabled: true,

  _updateCount: 0,
  _crashAfter: 120,  // ~2 saniye sonra hata fırlat

  init(game) {
    console.log('[test_hata] init tamam, update bekleniyor...');
  },

  update(dt) {
    this._updateCount++;
    if (this._updateCount >= this._crashAfter) {
      console.error('[test_hata] 2 saniye doldu, bilerek hata fırlatılıyor!');
      throw new Error('update hatası: bilerek fırlatılan hata');
    }
  },

  destroy() {
    console.log('[test_hata] destroy çağrıldı');
  }
});
