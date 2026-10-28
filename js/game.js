/* =========================================================
   game.js — Logika inti permainan (Versi Final)
   ========================================================= */

// State Permainan
let state = {
  soalList: [],
  indexSoal: 0,
  skorBiru: 0,
  skorMerah: 0,
  fase: "IDLE", 
  timMenjawab: null, 
  timTerakhirSalah: null,
  timerInterval: null,
  waktuTersisa: 10
};

// Elemen UI
const elSkorBiru = document.getElementById("skorBiru");
const elSkorMerah = document.getElementById("skorMerah");
const elAreaSoal = document.getElementById("areaSoal");
const elBtnBiru = document.getElementById("btnBiru");
const elBtnMerah = document.getElementById("btnMerah");
const elTimer = document.getElementById("timerUi");
const elOverlay = document.getElementById("overlay");
const elOverlayJudul = document.getElementById("overlayJudul");
const elOverlayPesan = document.getElementById("overlayPesan");
const elOverlayBtn = document.getElementById("overlayBtn");

/* ---------- INISIALISASI ---------- */
window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const mapelId = params.get("mapel");

  if (!mapelId) {
    tampilkanOverlay("Error", "Mapel tidak dipilih. Kembali ke dashboard guru.", () => { window.location.href = "guru.html"; });
    return;
  }

  if (typeof getSoal !== "function") {
     return alert("Error: storage.js tidak termuat.");
  }

  state.soalList = getSoal(mapelId);
  
  if (state.soalList.length === 0) {
    tampilkanOverlay("Kosong", "Belum ada soal untuk mapel ini.", () => { window.location.href = "guru.html"; });
    return;
  }

  elBtnBiru.addEventListener("pointerdown", (e) => { e.preventDefault(); tekanBel('biru'); });
  elBtnMerah.addEventListener("pointerdown", (e) => { e.preventDefault(); tekanBel('merah'); });

  muatSoal(0);
});

/* ---------- MUAT SOAL ---------- */
function muatSoal(index) {
  if (index >= state.soalList.length) {
    return selesaikanGame();
  }

  state.indexSoal = index;
  state.fase = "BEL";
  state.timMenjawab = null;
  state.timTerakhirSalah = null;
  
  const soal = state.soalList[index];

  elBtnBiru.classList.add("aktif");
  elBtnMerah.classList.add("aktif");
  elAreaSoal.style.boxShadow = "none";

  let html = `<div class="teks-soal">${soal.teks}</div>`;
  if (soal.gambar) html += `<img src="${soal.gambar}" class="gambar-soal" />`;
  
  if (soal.tipe === "pg") {
    html += `<div class="opsi-container" id="opsiContainer" style="display:none">`;
    soal.opsi.forEach((opt, i) => {
      html += `<button class="opsi-btn" onclick="jawabPG(${i})">${opt}</button>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="essay-container" id="essayContainer" style="display:none">
               <input type="text" class="essay-input" id="inputEssay" placeholder="Ketik jawaban..." autocomplete="off" />
               <button class="btn-kirim" onclick="jawabEssay()">Kirim</button>
             </div>`;
  }

  html += `<div class="info" style="margin-top:20px; font-size:1.2rem; color:#aaa;">Tekan tombol bel di bawah untuk merebut!</div>`;
  
  elAreaSoal.innerHTML = html;
}

/* ---------- LOGIKA BEL ---------- */
function tekanBel(tim) {
  if (state.fase !== "BEL" && state.fase !== "LEMPAR") return;

  if (state.timTerakhirSalah === tim) {
    alert(`Tim ${tim.toUpperCase()} sudah salah di soal ini. Tunggu tim lawan!`);
    return;
  }
  mainkanSuara('bel'); // <--- TAMBAHKAN INI

  state.fase = "JAWAB";
  state.timMenjawab = tim;
  state.timTerakhirSalah = null;

  elBtnBiru.classList.remove("aktif");
  elBtnMerah.classList.remove("aktif");

  const infoAwal = elAreaSoal.querySelector(".info");
  if (infoAwal) infoAwal.remove();

  if (state.soalList[state.indexSoal].tipe === "pg") {
    document.getElementById("opsiContainer").style.display = "grid";
  } else {
    document.getElementById("essayContainer").style.display = "flex";
    document.getElementById("inputEssay").focus();
  }

  elAreaSoal.style.boxShadow = tim === 'biru' ? "inset 0 0 50px #2563eb" : "inset 0 0 50px #dc2626";

  mulaiTimer();
}

/* ---------- TIMER ---------- */
function mulaiTimer() {
  state.waktuTersisa = 10;
  elTimer.textContent = state.waktuTersisa;
  elTimer.classList.add("tampil");

  state.timerInterval = setInterval(() => {
    state.waktuTersisa--;
    elTimer.textContent = state.waktuTersisa;
    if (state.waktuTersisa <= 0) {
      hentikanTimer();
      waktuHabis();
    }
  }, 1000);
}

function hentikanTimer() {
  clearInterval(state.timerInterval);
  elTimer.classList.remove("tampil");
}

function waktuHabis() {
  const lawan = state.timMenjawab === 'biru' ? 'MERAH' : 'BIRU';
  tampilkanOverlay("Waktu Habis!", `Giliran dilempar ke tim ${lawan}.`, () => {
    lemparKeLawan();
  });
}

/* ---------- JAWABAN ---------- */
function jawabPG(indexPilihan) {
  if (state.fase !== "JAWAB") return;
  hentikanTimer();

  const soal = state.soalList[state.indexSoal];
  const benar = indexPilihan === soal.kunci;

  if (benar) {
    prosesBenar();
  } else {
	  mainkanSuara('salah'); // <--- TAMBAHKAN INI
    alert("Salah!");
    lemparKeLawan();
  }
}

function jawabEssay() {
  if (state.fase !== "JAWAB") return;
  hentikanTimer();

  const soal = state.soalList[state.indexSoal];
  const jawaban = document.getElementById("inputEssay").value.toLowerCase();
  
  const benar = soal.keywords.every(kw => jawaban.includes(kw.toLowerCase()));

  if (benar) {
    prosesBenar();
  } else {
	  mainkanSuara('salah'); // <--- TAMBAHKAN INI
    alert("Jawaban kurang tepat / salah!");
    lemparKeLawan();
  }
}

function prosesBenar() {
	 mainkanSuara('benar'); // <--- TAMBAHKAN INI
  const soal = state.soalList[state.indexSoal];
  const tim = state.timMenjawab;

  if (tim === 'biru') state.skorBiru += soal.poin;
  else state.skorMerah += soal.poin;

  updateSkorUi();
  tampilkanOverlay(`BENAR!`, `Tim ${tim.toUpperCase()} mendapat ${soal.poin} poin.`, () => {
    muatSoal(state.indexSoal + 1);
  });
}

/* ---------- LEMPAR KE LAWAN ---------- */
function lemparKeLawan() {
  const timSalah = state.timMenjawab;

  if (state.fase === "LEMPAR") {
    return bukaJawaban();
  }

  state.fase = "LEMPAR";
  state.timTerakhirSalah = timSalah;
  
  if (state.soalList[state.indexSoal].tipe === "pg") {
    document.getElementById("opsiContainer").style.display = "none";
  } else {
    document.getElementById("essayContainer").style.display = "none";
  }
  elAreaSoal.style.boxShadow = "none";

  elBtnBiru.classList.add("aktif");
  elBtnMerah.classList.add("aktif");
  
  const lawan = timSalah === 'biru' ? 'MERAH' : 'BIRU';
  const info = document.createElement("div");
  info.className = "info";
  info.style.cssText = "margin-top:20px; font-size:1.5rem; color:#eab308;";
  info.textContent = `Dilempar! Tim ${lawan} tekan bel untuk menjawab.`;
  
  // Hapus info lama jika ada, lalu tambah baru
  const oldInfo = elAreaSoal.querySelector(".info");
  if (oldInfo) oldInfo.remove();
  elAreaSoal.appendChild(info);
}

/* ---------- BUKA JAWABAN & LANJUT ---------- */
function bukaJawaban() {
  state.fase = "BUKA_JAWABAN";
  hentikanTimer();
  elBtnBiru.classList.remove("aktif");
  elBtnMerah.classList.remove("aktif");

  const soal = state.soalList[state.indexSoal];
  let kunciTeks = "";
  if (soal.tipe === "pg") {
    kunciTeks = soal.opsi[soal.kunci];
  } else {
    kunciTeks = soal.keywords.join(", ");
  }

  tampilkanOverlay("Kedua Tim Salah", `Jawaban benar: ${kunciTeks}`, () => {
    muatSoal(state.indexSoal + 1);
  });
}

/* ---------- SELESAI ---------- */
function selesaikanGame() {
  state.fase = "SELESAI";
  elBtnBiru.classList.remove("aktif");
  elBtnMerah.classList.remove("aktif");
  elAreaSoal.innerHTML = "<h1>PERMAINAN SELESAI</h1>";

  let juara = "SERI";
  if (state.skorBiru > state.skorMerah) juara = "TIM BIRU MENANG!";
  else if (state.skorMerah > state.skorBiru) juara = "TIM MERAH MENANG!";

  tampilkanOverlay("Selesai", `${juara} (Biru ${state.skorBiru} - ${state.skorMerah} Merah)`, () => {
    window.location.href = "guru.html";
  });
}

/* ---------- UI HELPERS ---------- */
function updateSkorUi() {
  elSkorBiru.textContent = state.skorBiru;
  elSkorMerah.textContent = state.skorMerah;
}

function tampilkanOverlay(judul, pesan, aksiLanjut) {
  elOverlayJudul.textContent = judul;
  elOverlayPesan.textContent = pesan;
  elOverlay.classList.remove("hidden");
  
  const newBtn = elOverlayBtn.cloneNode(true);
  elOverlayBtn.parentNode.replaceChild(newBtn, elOverlayBtn);
  
  newBtn.addEventListener("click", () => {
    elOverlay.classList.add("hidden");
    if (aksiLanjut) aksiLanjut();
  });
}
/* ---------- SISTEM SUARA (WEB AUDIO API) ---------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function mainkanSuara(tipe) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume(); // Browser butuh interaksi user sebelum bunyi
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (tipe === 'benar') {
    // Suara ceria (nada naik)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  } 
  else if (tipe === 'salah') {
    // Suara buzz (nada rendah)
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.linearRampToValueAtTime(100, now + 0.4);
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.4);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }
  else if (tipe === 'bel') {
    // Suara 'ting' saat tombol bel ditekan
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }
}