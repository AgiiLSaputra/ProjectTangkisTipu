// setSelectionService.js — logika murni pemilihan set soal & validasi jadwal.
// Dipisah dari controller agar dapat diuji tanpa koneksi database.

export const TIPE_SET_KE_TES = { pre: 'pretest', post: 'posttest', retensi: 'retensi' };
export const TES_KE_TIPE_SET = { pretest: 'pre', posttest: 'post', retensi: 'retensi' };

export const JALUR_KE_TRACK = { anak: 0, dewasa: 1, lansia: 2 };
export const TRACK_KE_JALUR = { 0: 'anak', 1: 'dewasa', 2: 'lansia' };

// Batas retensi default (hari) sesuai PRD FR-14. Hanya dipakai untuk tipe retensi.
export const RETENSI_HARI = 14;

// Penanda id set bawaan sistem (dibuat otomatis, bukan oleh admin/komunitas).
export const ID_SET_DEFAULT_PREFIX = 'SET-DEFAULT-';

export function tipeSetDariTes(type) {
  return TES_KE_TIPE_SET[type] ?? null;
}

export function trackDariJalur(jalur) {
  return JALUR_KE_TRACK[jalur] ?? null;
}

function keTanggal(nilai) {
  if (!nilai) return null;
  if (nilai instanceof Date) return nilai;
  const d = new Date(nilai);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Normalisasi ke awal hari (UTC) agar perbandingan berbasis tanggal kalender.
// Kolom rilis_at/tutup_at bertipe DATE, sehingga nilainya merepresentasikan
// awal hari pada tanggal tersebut.
function awalHari(nilai) {
  const d = keTanggal(nilai);
  if (!d) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Status jadwal set relatif terhadap `now`, dibandingkan per tanggal kalender (UTC):
// - 'belum'  : tanggal `now` sebelum tanggal rilis
// - 'tutup'  : tanggal `now` setelah tanggal tutup (tanggal tutup inklusif)
// - 'aktif'  : dalam rentang tanggal, termasuk hari rilis dan hari tutup
export function statusJadwal(set, now = new Date()) {
  const rilis = awalHari(set?.rilis_at ?? set?.rilis);
  const tutup = awalHari(set?.tutup_at ?? set?.tutup);
  const ref = awalHari(now) ?? awalHari(new Date());

  if (rilis && ref < rilis) return 'belum';
  if (tutup && ref > tutup) return 'tutup';
  return 'aktif';
}

// Set boleh dipakai peserta bila statusnya 'aktif' DAN jadwalnya sedang berjalan.
export function setTersediaUntukPeserta(set, now = new Date()) {
  if (!set) return false;
  if (set.status !== 'aktif') return false;
  return statusJadwal(set, now) === 'aktif';
}

// Pilih set terbaik dari daftar kandidat untuk (jalur, tipe tes) dengan aturan
// kode kelas — berlaku sama rata untuk pre-test, post-test, dan retensi:
// - Set global (tanpa ikatan kode kelas) boleh dipakai semua peserta.
// - Set yang terikat kode kelas hanya boleh dipakai peserta yang kodenya cocok.
// - Peserta tanpa kode kelas (belajar mandiri) hanya memakai set global.
// Prioritas: set khusus milik peserta > set global buatan admin/komunitas >
// set bawaan sistem (SET-DEFAULT-*) paling akhir; terbaru (created_at) menang
// di dalam tiap kategori.
export function pilihSet(kandidat, { jalur, type, classCode = '', now = new Date() } = {}) {
  const tipeSet = tipeSetDariTes(type);
  if (!tipeSet) return null;
  const kode = normKodeKelas(classCode);

  const cocok = (kandidat ?? []).filter(
    (s) => s && s.jalur === jalur && s.tipe === tipeSet && setTersediaUntukPeserta(s, now),
  );
  if (cocok.length === 0) return null;

  const khusus = [];
  const global = [];
  const bawaan = [];
  for (const s of cocok) {
    const daftar = daftarKodeKelas(s);
    if (daftar.length > 0) {
      // Set khusus milik kelompok lain sengaja dibuang: tidak boleh dipakai
      // peserta yang tidak memiliki kode tersebut.
      if (kode && daftar.includes(kode)) khusus.push(s);
    } else if (String(s.id ?? '').startsWith(ID_SET_DEFAULT_PREFIX)) {
      // Set bawaan sistem hanya cadangan terakhir — tidak boleh menyingkirkan
      // set yang dibuat admin/komunitas walaupun lebih baru.
      bawaan.push(s);
    } else {
      global.push(s);
    }
  }

  khusus.sort(bandingSetTerbaru);
  global.sort(bandingSetTerbaru);
  bawaan.sort(bandingSetTerbaru);
  return khusus[0] ?? global[0] ?? bawaan[0] ?? null;
}

// Pengurutan kandidat set: set bawaan sistem di belakang, sisanya terbaru dulu.
function bandingSetTerbaru(a, b) {
  const da = String(a?.id ?? '').startsWith(ID_SET_DEFAULT_PREFIX) ? 1 : 0;
  const db = String(b?.id ?? '').startsWith(ID_SET_DEFAULT_PREFIX) ? 1 : 0;
  if (da !== db) return da - db;
  const ta = keTanggal(a?.created_at)?.getTime() ?? 0;
  const tb = keTanggal(b?.created_at)?.getTime() ?? 0;
  return tb - ta;
}

// Normalisasi kode kelas agar perbandingan tidak peka huruf besar/kecil & spasi.
function normKodeKelas(nilai) {
  return String(nilai ?? '').trim().toUpperCase();
}

// Daftar kode kelas sebuah set. Bila kolomnya tidak ikut dipilih (null/undefined)
// dianggap set global agar perilaku lama tidak berubah.
function daftarKodeKelas(set) {
  const kode = set?.kode_kelas;
  if (!Array.isArray(kode)) return [];
  return kode.map(normKodeKelas).filter(Boolean);
}

// Seragam dengan pilihSet: aturan kode kelas yang sama dipakai untuk pre-test.
// Dipertahankan sebagai nama lama agar pemanggil lama tetap terbaca jelas.
export function pilihSetPretest(kandidat, { jalur, classCode = '', now = new Date() } = {}) {
  return pilihSet(kandidat, { jalur, type: 'pretest', classCode, now });
}

// Id deterministik set bawaan sistem untuk (jalur, tipe tes). Dibuat otomatis
// saat jalur tersebut belum punya set yang bisa dipakai peserta.
// Format sama dengan konvensi migrasi 009: SET-DEFAULT-<track>-<type>.
export function idSetBawaan(jalur, type) {
  const track = JALUR_KE_TRACK[jalur];
  if (track === undefined || !TES_KE_TIPE_SET[type]) return null;
  return `${ID_SET_DEFAULT_PREFIX}${track}-${type}`;
}

export function idSetPretestBawaan(jalur) {
  return idSetBawaan(jalur, 'pretest');
}

// Validasi daftar jawaban: tolak duplikat questionId dan opsi di luar rentang.
export function validasiJawaban(answers, questions) {
  const soalMap = new Map((questions ?? []).map((q) => [String(q.id), q]));
  const terlihat = new Set();
  const duplikat = [];
  const tidakDikenal = [];
  const opsiTidakValid = [];

  for (const a of answers ?? []) {
    const qid = String(a.questionId);
    if (terlihat.has(qid)) {
      duplikat.push(qid);
      continue;
    }
    terlihat.add(qid);

    const soal = soalMap.get(qid);
    if (!soal) {
      tidakDikenal.push(qid);
      continue;
    }
    const jumlahOpsi = Array.isArray(soal.opsi) ? soal.opsi.length : 0;
    const pilihan = Number(a.selectedOption);
    if (!Number.isInteger(pilihan) || pilihan < 0 || (jumlahOpsi > 0 && pilihan >= jumlahOpsi)) {
      opsiTidakValid.push({ questionId: qid, selectedOption: a.selectedOption });
    }
  }

  return { duplikat, tidakDikenal, opsiTidakValid, valid: duplikat.length === 0 && tidakDikenal.length === 0 && opsiTidakValid.length === 0 };
}

// Batas post-test per set: satu submit sukses per (peserta, set).
export function bolehMulaiPosttest(attempts, setId) {
  const relevan = (attempts ?? []).filter((a) => a.set_id === setId);
  const sudahSubmit = relevan.find((a) => a.score !== null);
  if (sudahSubmit) return { boleh: false, alasan: 'SUDAH_SUBMIT', attemptId: sudahSubmit.id };
  const pending = relevan.find((a) => a.score === null);
  return { boleh: true, attemptId: pending ? pending.id : null };
}

// Aturan retensi 14 hari: peserta boleh mengulang hanya bila sudah lewat RETENSI_HARI
// sejak submit post-test terakhir. Mengembalikan { boleh, tersediaPada }.
export function cekRetensi(posttestTerakhir, now = new Date(), hari = RETENSI_HARI) {
  if (!posttestTerakhir) return { boleh: true, tersediaPada: null };
  const dasar = keTanggal(posttestTerakhir.submitted_at ?? posttestTerakhir.created_at);
  if (!dasar) return { boleh: true, tersediaPada: null };
  const tersedia = new Date(dasar.getTime() + hari * 24 * 60 * 60 * 1000);
  const ref = keTanggal(now) ?? new Date();
  return { boleh: ref >= tersedia, tersediaPada: tersedia };
}

export default {
  TIPE_SET_KE_TES,
  TES_KE_TIPE_SET,
  JALUR_KE_TRACK,
  TRACK_KE_JALUR,
  RETENSI_HARI,
  ID_SET_DEFAULT_PREFIX,
  tipeSetDariTes,
  trackDariJalur,
  statusJadwal,
  setTersediaUntukPeserta,
  pilihSet,
  pilihSetPretest,
  idSetBawaan,
  idSetPretestBawaan,
  validasiJawaban,
  bolehMulaiPosttest,
  cekRetensi,
};
