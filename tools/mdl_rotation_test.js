#!/usr/bin/env node
/*
 * mdl_rotation_test.js - Silah modeli icin dogru first-person rotasyonunu bulur
 * Kullanim: node tools/mdl_rotation_test.js assets/models/v_ak47.mdl
 *
 * .mdl'den geometry sinirlarini okur, model_mdl.js'in yaptigi
 * boneGroup.rotateX(-PI/2) donusumunu simule eder ve aday euler
 * acilarini test ederek hangi ayarin "namlu ileri, silah dik"
 * gorunumu verdigini raporlar. Sonucu weapon_ak47.js icindeki
 * model.rotation.set(...) satirina yapistir.
 */
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Kullanim: node tools/mdl_rotation_test.js <dosya.mdl>');
  process.exit(1);
}

const buf = fs.readFileSync(file);
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
function u32(o) { return dv.getUint32(o, true); }
function f32(o) { return dv.getFloat32(o, true); }
function str(o, n) { let s = ''; for (let i = 0; i < n; i++) { const c = dv.getUint8(o + i); if (!c) break; s += String.fromCharCode(c); } return s; }
function fmt(v) { return v.map(x => Number(x.toFixed(2))); }

// ---------- GEOMETRI SINIRLARI ----------
let gmin = [Infinity, Infinity, Infinity];
let gmax = [-Infinity, -Infinity, -Infinity];
{
  const numbodyparts = u32(140 + 16 * 4);
  const bodypartindex = u32(140 + 17 * 4);
  for (let b = 0; b < numbodyparts; b++) {
    const bp = bodypartindex + b * 76;
    const nummodels = u32(bp + 64);
    const modelindex = u32(bp + 72);
    for (let m = 0; m < nummodels; m++) {
      const mo = modelindex + m * 112;
      const numverts = u32(mo + 80);
      const vertindex = u32(mo + 88);
      for (let v = 0; v < numverts; v++) {
        const x = f32(vertindex + v * 12);
        const y = f32(vertindex + v * 12 + 4);
        const z = f32(vertindex + v * 12 + 8);
        for (let a = 0; a < 3; a++) {
          const c = [x, y, z][a];
          if (c < gmin[a]) gmin[a] = c;
          if (c > gmax[a]) gmax[a] = c;
        }
      }
    }
  }
}

console.log('==============================================');
console.log('ROTASYON TESTI  |  ' + file);
console.log('==============================================');
console.log('HL boyutlari (namlu +Z, yukari +Y):');
console.log('  MIN=' + fmt(gmin) + '  MAX=' + fmt(gmax) +
  '  SIZE=' + fmt([gmax[0] - gmin[0], gmax[1] - gmin[1], gmax[2] - gmin[2]]));
console.log('');

// ---------- MATRIS YARDIMCILARI ----------
function rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; }
function rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; }
function rotZ(a) { const c = Math.cos(a), s = Math.sin(a); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; }
function mul(A, B) {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
    C[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
  return C;
}
function eulerMatrix(order, x, y, z) {
  const m = { X: rotX(x), Y: rotY(y), Z: rotZ(z) };
  const o = order.toUpperCase().split('');
  return mul(m[o[0]], mul(m[o[1]], m[o[2]]));
}
function apply(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
  ];
}
const near = (a, b) => Math.abs(a - b) < 1e-6;
function same(v, w) { return near(v[0], w[0]) && near(v[1], w[1]) && near(v[2], w[2]); }

// ---------- ADAY ACILAR ----------
// Model, boneGroup.rotateX(-PI/2) ile kuruldugu icin:
//   HL +Z (namlu) -> Three +Y,  HL +Y (yukari) -> Three -Z,
//   HL +X (sag)   -> Three +X,  HL -Y (asagi)   -> Three +Z
// Istenen gorunum (kamera -Z'ye bakiyor):
//   namlu -> -Z (ileri), dipcik -> +Z (kameraya), ust -> +Y, alt -> -Y, sag -> +X
const WANT = {
  barrel: [0, 0, -1],
  stock: [0, 0, 1],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  right: [1, 0, 0]
};
const AFTER_BONE = {
  barrel: [0, 1, 0],   // HL +Z
  stock: [0, -1, 0],   // HL -Z
  top: [0, 0, -1],     // HL +Y
  bottom: [0, 0, 1],   // HL -Y
  right: [1, 0, 0]     // HL +X
};

const angles = [0, Math.PI / 2, -Math.PI / 2, Math.PI, -Math.PI];
const results = [];
for (const order of ['YXZ', 'XYZ', 'ZYX', 'ZXY']) {
  for (const x of angles) for (const y of angles) for (const z of [0, Math.PI]) {
    const M = eulerMatrix(order, x, y, z);
    let score = 0;
    const details = {};
    for (const k of Object.keys(WANT)) {
      const r = apply(M, AFTER_BONE[k]);
      details[k] = r;
      if (same(r, WANT[k])) score++;
    }
    results.push({ order, x, y, z, score, details });
  }
}
results.sort((a, b) => b.score - a.score);

console.log('Bulunan ayarlar (en iyi 3):');
console.log('  Hedef: namlu=-Z, dipcik=+Z, ust=+Y, alt=-Y, sag=+X   (puan / 5)');
let shown = 0;
for (const r of results) {
  if (shown >= 3) break;
  const main = r.score >= 4 ? '✔' : '';
  const line = '  ' + r.order + '  rotation.set(' +
    fmt([r.x, r.y, r.z]).join(', ') + ')   puan=' + r.score + ' ' + main;
  console.log(line);
  shown++;
}
console.log('');

const best = results[0];
console.log('ONERILEN AYAR (fx_firstperson order=YXZ kullanir):');
const mirrored = !same(best.details.right, WANT.right);
console.log('  model.rotation.order = \'YXZ\';');
console.log('  model.rotation.set(' +
  fmt([best.x, best.y, best.z]).join(', ') + ');');
if (best.score < 5) {
  if (mirrored) {
    console.log('  model.scale.set(-S, S, S);   // sag/sol yansima duzelt (silahin diger yuzu)');
  }
  console.log('  NOT: Puan 5 degil; sartlardan biri karsilanamiyor. En yakin ayar yukarida.');
}

// ---------- OLCEK ONERISI ----------
const stockReach = -gmin[2];   // HL -Z = dipcigin modele gore uzantisi
const slotZ = 0.42;            // fp_weapon_slot kameraya uzaklik
const sMax = stockReach > 0 ? slotZ / stockReach : Infinity;
console.log('');
console.log('OLCEK (S):  S < ' + sMax.toFixed(4) + '  (dipcik kameraya carpmasin)');
console.log('  Baslangic onerisi: ' + (Math.min(0.06, sMax)).toFixed(3));
console.log('==============================================');
