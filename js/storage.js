/* =========================================================
   storage.js — Fondasi penyimpanan (localStorage)
   Semua akses data mapel & soal lewat file ini.
   ========================================================= */

const STORAGE_KEYS = {
  MAPEL: "kuis_mapel",
  SOAL: "kuis_soal",
};

/* ---------- Helper baca/tulis JSON ---------- */
function bacaData(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Gagal baca", key, e);
    return fallback;
  }
}

function tulisData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Gagal simpan (mungkin kuota penuh)", e);
    alert("Gagal menyimpan. Penyimpanan browser mungkin penuh (gambar terlalu banyak/besar).");
    return false;
  }
}

/* ---------- ID sederhana ---------- */
function buatId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* =========================================================
   MAPEL
   ========================================================= */
function getMapel() {
  return bacaData(STORAGE_KEYS.MAPEL);
}

function tambahMapel(nama) {
  const list = getMapel();
  const baru = { id: buatId(), nama: nama.trim() };
  list.push(baru);
  tulisData(STORAGE_KEYS.MAPEL, list);
  return baru;
}

function hapusMapel(mapelId) {
  // hapus mapel + semua soal di dalamnya
  tulisData(STORAGE_KEYS.MAPEL, getMapel().filter(m => m.id !== mapelId));
  tulisData(STORAGE_KEYS.SOAL, getSoal().filter(s => s.mapelId !== mapelId));
}

/* =========================================================
   SOAL
   ========================================================= */
function getSoal(mapelId = null) {
  const all = bacaData(STORAGE_KEYS.SOAL);
  return mapelId ? all.filter(s => s.mapelId === mapelId) : all;
}

function tambahSoal(soal) {
  // soal = { mapelId, tipe, teks, gambar, opsi?, kunci?, keywords?, poin }
  const list = getSoal();
  const baru = { id: buatId(), ...soal };
  list.push(baru);
  const ok = tulisData(STORAGE_KEYS.SOAL, list);
  return ok ? baru : null;
}

function hapusSoal(soalId) {
  tulisData(STORAGE_KEYS.SOAL, getSoal().filter(s => s.id !== soalId));
}

/* =========================================================
   GAMBAR
   ========================================================= */

// Kompres gambar dari file → base64 (maks sisi 800px, kualitas 0.7)
function kompresGambar(file, maxSisi = 800, kualitas = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSisi || height > maxSisi) {
          const rasio = Math.min(maxSisi / width, maxSisi / height);
          width = Math.round(width * rasio);
          height = Math.round(height * rasio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", kualitas));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* =========================================================
   CEK KUOTA localStorage
   ========================================================= */
function cekKuota() {
  let total = 0;
  for (const k in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
      total += (localStorage[k].length + k.length) * 2; // kira-kira byte (UTF-16)
    }
  }
  const batas = 5 * 1024 * 1024; // ~5 MB
  return {
    terpakai: total,
    batas,
    persen: Math.min(100, Math.round((total / batas) * 100)),
  };
}