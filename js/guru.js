/* =========================================================
   guru.js — Logika dashboard guru
   ========================================================= */

let gambarTerpilih = null; // base64 hasil upload, atau null

/* ---------- Inisialisasi ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderMapel();
  renderPilihanMapel();
  renderDaftarSoal();
  updateKuota();

  // event mapel
  document.getElementById("btnTambahMapel").addEventListener("click", tambahMapelHandler);
  document.getElementById("tipeSoal").addEventListener("change", toggleBlokSoal);

  // event gambar
  document.getElementById("gambarLink").addEventListener("input", previewLink);
  document.getElementById("gambarFile").addEventListener("change", uploadGambar);

  // simpan soal
  document.getElementById("btnSimpanSoal").addEventListener("click", simpanSoalHandler);

  // filter daftar soal
  document.getElementById("filterMapelSoal").addEventListener("change", renderDaftarSoal);
});

/* ---------- MAPEL ---------- */
function tambahMapelHandler() {
  const input = document.getElementById("inputMapel");
  const nama = input.value.trim();
  if (!nama) return alert("Nama mapel kosong.");
  tambahMapel(nama);
  input.value = "";
  renderMapel();
  renderPilihanMapel();
  updateKuota();
}

function renderMapel() {
  const ul = document.getElementById("daftarMapel");
  ul.innerHTML = "";
  const list = getMapel();
  if (!list.length) {
    ul.innerHTML = "<li class='info'>Belum ada mapel.</li>";
    return;
  }
  list.forEach(m => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${m.nama}</span>`;
    
    // Grup tombol
    const btnGroup = document.createElement("div");
    btnGroup.style.display = "flex";
    btnGroup.style.gap = "8px";

    // Tombol Mulai
    const btnMulai = document.createElement("button");
    btnMulai.textContent = "Mulai Game";
    btnMulai.className = "btn-kecil";
    btnMulai.style.background = "#16a34a";
    btnMulai.style.color = "#fff";
    btnMulai.onclick = () => {
      if (getSoal(m.id).length === 0) {
        return alert("Mapel ini belum punya soal. Tambah soal dulu!");
      }
      window.location.href = `game.html?mapel=${m.id}`;
    };
    btnGroup.appendChild(btnMulai);

    // Tombol Hapus
    const btnHapus = document.createElement("button");
    btnHapus.textContent = "Hapus";
    btnHapus.className = "btn-kecil btn-merah";
    btnHapus.onclick = () => {
      if (confirm(`Hapus mapel "${m.nama}" beserta soalnya?`)) {
        hapusMapel(m.id);
        renderMapel(); renderPilihanMapel(); renderDaftarSoal(); updateKuota();
      }
    };
    btnGroup.appendChild(btnHapus);
    
    li.appendChild(btnGroup);
    ul.appendChild(li);
  });
}

function renderPilihanMapel() {
  const list = getMapel();
  const opsiHtml = list.map(m => `<option value="${m.id}">${m.nama}</option>`).join("");
  document.getElementById("pilihMapelSoal").innerHTML = opsiHtml || "<option value=''>— belum ada mapel —</option>";
  document.getElementById("filterMapelSoal").innerHTML =
    "<option value=''>Semua Mapel</option>" + opsiHtml;
}

/* ---------- GAMBAR ---------- */
function previewLink() {
  const url = document.getElementById("gambarLink").value.trim();
  gambarTerpilih = null; // kalau pakai link, reset upload
  tampilPreview(url);
}

async function uploadGambar(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const base64 = await kompresGambar(file);
    gambarTerpilih = base64;
    document.getElementById("gambarLink").value = ""; // upload menang
    tampilPreview(base64);
  } catch (err) {
    alert("Gagal memproses gambar.");
    console.error(err);
  }
}

function tampilPreview(src) {
  const box = document.getElementById("previewGambar");
  box.innerHTML = src ? `<img src="${src}" alt="preview" />` : "";
}

function ambilGambarAkhir() {
  if (gambarTerpilih) return gambarTerpilih;
  const url = document.getElementById("gambarLink").value.trim();
  return url || null;
}

/* ---------- TOGGLE PG / ESSAY ---------- */
function toggleBlokSoal() {
  const tipe = document.getElementById("tipeSoal").value;
  document.getElementById("blokPG").style.display = tipe === "pg" ? "block" : "none";
  document.getElementById("blokEssay").style.display = tipe === "essay" ? "block" : "none";
}

/* ---------- SIMPAN SOAL ---------- */
function simpanSoalHandler() {
  const mapelId = document.getElementById("pilihMapelSoal").value;
  if (!mapelId) return alert("Buat/pilih mapel dulu.");

  const tipe = document.getElementById("tipeSoal").value;
  const teks = document.getElementById("teksSoal").value.trim();
  if (!teks) return alert("Pertanyaan kosong.");

  const gambar = ambilGambarAkhir();
  const poin = parseInt(document.getElementById("poinSoal").value) || 10;

  const soal = { mapelId, tipe, teks, gambar, poin };

  if (tipe === "pg") {
    const opsiInput = [...document.querySelectorAll(".opsiInput")].map(i => i.value.trim());
    if (opsiInput.some(o => !o)) return alert("Semua 4 opsi harus diisi.");
    const kunciEl = document.querySelector('input[name="kunci"]:checked');
    if (!kunciEl) return alert("Tandai kunci jawaban benar.");
    soal.opsi = opsiInput;
    soal.kunci = parseInt(kunciEl.value);
  } else {
    const kw = document.getElementById("keywordsEssay").value
      .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!kw.length) return alert("Isi minimal 1 kata kunci.");
    soal.keywords = kw;
  }

  const ok = tambahSoal(soal);
  if (!ok) return; // gagal simpan (kuota)

  resetFormSoal();
  renderDaftarSoal();
  updateKuota();
  alert("Soal tersimpan.");
}

function resetFormSoal() {
  document.getElementById("teksSoal").value = "";
  document.getElementById("gambarLink").value = "";
  document.getElementById("gambarFile").value = "";
  document.getElementById("keywordsEssay").value = "";
  document.getElementById("poinSoal").value = 10;
  document.querySelectorAll(".opsiInput").forEach(i => i.value = "");
  document.querySelectorAll('input[name="kunci"]').forEach(r => r.checked = false);
  gambarTerpilih = null;
  tampilPreview("");
}

/* ---------- DAFTAR SOAL ---------- */
function renderDaftarSoal() {
  const mapelId = document.getElementById("filterMapelSoal").value || null;
  const mapelMap = Object.fromEntries(getMapel().map(m => [m.id, m.nama]));
  const list = getSoal(mapelId);
  const box = document.getElementById("daftarSoal");
  box.innerHTML = "";

  if (!list.length) {
    box.innerHTML = "<p class='info'>Belum ada soal.</p>";
    return;
  }

  list.forEach((s, idx) => {
    const div = document.createElement("div");
    div.className = "soal-item";
    const gambarnya = s.gambar ? `<img src="${s.gambar}" class="thumb" />` : "";
    div.innerHTML = `
      ${gambarnya}
      <div class="soal-isi">
        <strong>${idx + 1}. [${s.tipe.toUpperCase()}] ${s.teks}</strong>
        <small>Mapel: ${mapelMap[s.mapelId] || "-"} • Poin: ${s.poin}</small>
      </div>
    `;
    const btn = document.createElement("button");
    btn.textContent = "Hapus";
    btn.className = "btn-kecil btn-merah";
    btn.onclick = () => {
      if (confirm("Hapus soal ini?")) { hapusSoal(s.id); renderDaftarSoal(); updateKuota(); }
    };
    div.appendChild(btn);
    box.appendChild(div);
  });
}

/* ---------- KUOTA ---------- */
function updateKuota() {
  const k = cekKuota();
  document.getElementById("kuotaInfo").textContent =
    `Penyimpanan terpakai: ${(k.terpakai / 1024 / 1024).toFixed(2)} MB dari ~5 MB (${k.persen}%)`;
	
	  // Event Export/Import
  document.getElementById("btnExport").addEventListener("click", exportData);
  document.getElementById("btnImport").addEventListener("click", () => document.getElementById("fileImport").click());
  document.getElementById("fileImport").addEventListener("change", importData);
}
/* ---------- EXPORT / IMPORT ---------- */
function exportData() {
  const data = {
    mapel: getMapel(),
    soal: getSoal()
  };
  
  if (data.mapel.length === 0) return alert("Belum ada data untuk di-export.");
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_kuis_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (!data.mapel || !data.soal) throw new Error("Format tidak valid");

      if (confirm("Import data ini? Data mapel & soal yang ada sekarang akan DIGANTI.")) {
        // Simpan ke localStorage langsung menggunakan key dari storage.js
        localStorage.setItem("kuis_mapel", JSON.stringify(data.mapel));
        localStorage.setItem("kuis_soal", JSON.stringify(data.soal));
        
        alert("Import berhasil! Halaman akan dimuat ulang.");
        window.location.reload();
      }
    } catch (err) {
      alert("Gagal import: File JSON tidak valid atau rusak.");
      console.error(err);
    }
  };
  reader.readAsText(file);
  e.target.value = ""; // Reset input file
}