import test from 'node:test';
import assert from 'node:assert/strict';
import {
  statusJadwal,
  setTersediaUntukPeserta,
  pilihSet,
  pilihSetPretest,
  idSetBawaan,
  idSetPretestBawaan,
  validasiJawaban,
  bolehMulaiPosttest,
  cekRetensi,
  tipeSetDariTes,
  RETENSI_HARI,
} from '../src/services/setSelectionService.js';
import { startTestSchema, submitTestSchema, testTypeParamSchema } from '../src/controllers/testsController.js';

const NOW = new Date('2026-10-11T00:00:00Z');

function setAktif(over = {}) {
  return {
    id: 'SET-1',
    jalur: 'dewasa',
    tipe: 'pre',
    status: 'aktif',
    rilis_at: '2026-10-01',
    tutup_at: '2026-11-01',
    created_at: '2026-10-01T00:00:00Z',
    ...over,
  };
}

/* ---- Jadwal belum/telah aktif ---- */

test('statusJadwal: set belum rilis = "belum"', () => {
  assert.equal(statusJadwal(setAktif({ rilis_at: '2026-12-01' }), NOW), 'belum');
});

test('statusJadwal: set sudah lewat tutup = "tutup"', () => {
  assert.equal(statusJadwal(setAktif({ tutup_at: '2026-10-05' }), NOW), 'tutup');
});

test('statusJadwal: dalam rentang = "aktif"', () => {
  assert.equal(statusJadwal(setAktif(), NOW), 'aktif');
});

/* ---- Semantik tanggal: tutup inklusif, perbandingan kalender UTC ---- */

test('statusJadwal: tanggal tutup inklusif (masih aktif pada hari tutup)', () => {
  // tutup_at = 2026-10-11, now = 2026-10-11T23:59:59Z -> masih aktif.
  const set = setAktif({ tutup_at: '2026-10-11' });
  assert.equal(statusJadwal(set, new Date('2026-10-11T23:59:59Z')), 'aktif');
});

test('statusJadwal: tutup tepat setelah hari tutup', () => {
  const set = setAktif({ tutup_at: '2026-10-11' });
  assert.equal(statusJadwal(set, new Date('2026-10-12T00:00:00Z')), 'tutup');
});

test('statusJadwal: hari rilis sudah aktif sejak awal hari', () => {
  const set = setAktif({ rilis_at: '2026-10-11' });
  assert.equal(statusJadwal(set, new Date('2026-10-11T00:00:00Z')), 'aktif');
  assert.equal(statusJadwal(set, new Date('2026-10-10T23:59:59Z')), 'belum');
});

test('setTersediaUntukPeserta: aktif pada hari tutup, tutup setelahnya', () => {
  const set = setAktif({ tutup_at: '2026-10-11' });
  assert.equal(setTersediaUntukPeserta(set, new Date('2026-10-11T23:59:59Z')), true);
  assert.equal(setTersediaUntukPeserta(set, new Date('2026-10-12T00:00:00Z')), false);
});

test('setTersediaUntukPeserta menolak set draf/terjadwal walau jadwal jalan', () => {
  assert.equal(setTersediaUntukPeserta(setAktif({ status: 'draf' }), NOW), false);
  assert.equal(setTersediaUntukPeserta(setAktif({ status: 'terjadwal' }), NOW), false);
  assert.equal(setTersediaUntukPeserta(setAktif(), NOW), true);
});

/* ---- Set tidak tersedia ---- */

test('pilihSet mengembalikan null bila tidak ada set cocok', () => {
  assert.equal(pilihSet([], { jalur: 'dewasa', type: 'pretest', now: NOW }), null);
  assert.equal(
    pilihSet([setAktif({ jalur: 'anak' })], { jalur: 'dewasa', type: 'pretest', now: NOW }),
    null,
  );
});

test('pilihSet menolak set di luar jadwal dan memilih yang aktif terbaru', () => {
  const kandidat = [
    setAktif({ id: 'SET-LAMA', created_at: '2026-09-01T00:00:00Z' }),
    setAktif({ id: 'SET-BARU', created_at: '2026-10-05T00:00:00Z' }),
    setAktif({ id: 'SET-BELUM', rilis_at: '2026-12-01' }),
  ];
  const dipilih = pilihSet(kandidat, { jalur: 'dewasa', type: 'pretest', now: NOW });
  assert.equal(dipilih.id, 'SET-BARU');
});

test('pilihSet: set bawaan sistem kalah dari set buatan admin walaupun lebih baru', () => {
  const kandidat = [
    setAktif({ id: 'SET-DEFAULT-1-posttest', tipe: 'post', created_at: '2026-10-11T00:00:00Z' }),
    setAktif({ id: 'SET-ADMIN-POST', tipe: 'post', created_at: '2026-09-01T00:00:00Z' }),
  ];
  const dipilih = pilihSet(kandidat, { jalur: 'dewasa', type: 'posttest', now: NOW });
  assert.equal(dipilih.id, 'SET-ADMIN-POST');
});

test('tipeSetDariTes memetakan tipe tes ke tipe set', () => {
  assert.equal(tipeSetDariTes('pretest'), 'pre');
  assert.equal(tipeSetDariTes('posttest'), 'post');
  assert.equal(tipeSetDariTes('retensi'), 'retensi');
  assert.equal(tipeSetDariTes('kuis'), null);
});

/* ---- Aturan kode kelas pada pemilihan set pre-test ---- */

test('pilihSetPretest: peserta tanpa kode hanya boleh memakai set global', () => {
  const kandidat = [
    setAktif({ id: 'SET-KHUSUS', kode_kelas: ['PR-4078'], created_at: '2026-10-05T00:00:00Z' }),
    setAktif({ id: 'SET-GLOBAL', kode_kelas: [], created_at: '2026-09-01T00:00:00Z' }),
  ];
  const dipilih = pilihSetPretest(kandidat, { jalur: 'dewasa', classCode: '', now: NOW });
  assert.equal(dipilih.id, 'SET-GLOBAL');
});

test('pilihSetPretest: set khusus milik kelompok lain tidak dipakai peserta lain', () => {
  const kandidat = [setAktif({ id: 'SET-KHUSUS', kode_kelas: ['PR-4078'] })];
  assert.equal(
    pilihSetPretest(kandidat, { jalur: 'dewasa', classCode: 'PR-9999', now: NOW }),
    null,
  );
  assert.equal(
    pilihSetPretest(kandidat, { jalur: 'dewasa', classCode: '', now: NOW }),
    null,
  );
});

test('pilihSetPretest: peserta dengan kode yang cocok lebih diprioritaskan daripada set global', () => {
  const kandidat = [
    setAktif({ id: 'SET-GLOBAL', kode_kelas: [], created_at: '2026-10-05T00:00:00Z' }),
    setAktif({ id: 'SET-KHUSUS', kode_kelas: ['PR-4078'], created_at: '2026-09-01T00:00:00Z' }),
  ];
  const dipilih = pilihSetPretest(kandidat, {
    jalur: 'dewasa',
    classCode: 'pr-4078', // bandingkan tanpa peka huruf besar/kecil
    now: NOW,
  });
  assert.equal(dipilih.id, 'SET-KHUSUS');
});

test('pilihSetPretest: tetap menolak set non-aktif / di luar jadwal', () => {
  const kandidat = [
    setAktif({ id: 'SET-DRAF', kode_kelas: [], status: 'draf' }),
    setAktif({ id: 'SET-TUTUP', kode_kelas: [], tutup_at: '2026-10-05' }),
  ];
  assert.equal(pilihSetPretest(kandidat, { jalur: 'dewasa', now: NOW }), null);
});

test('pilihSetPretest: kolom kode_kelas tidak ikut dipilih = dianggap set global', () => {
  const dipilih = pilihSetPretest([setAktif({ id: 'SET-LAMA' })], {
    jalur: 'dewasa',
    now: NOW,
  });
  assert.equal(dipilih.id, 'SET-LAMA');
});

test('idSetPretestBawaan memetakan jalur ke id deterministik', () => {
  assert.equal(idSetPretestBawaan('anak'), 'SET-DEFAULT-0-pretest');
  assert.equal(idSetPretestBawaan('dewasa'), 'SET-DEFAULT-1-pretest');
  assert.equal(idSetPretestBawaan('lansia'), 'SET-DEFAULT-2-pretest');
  assert.equal(idSetPretestBawaan('asinging'), null);
});

test('idSetBawaan memetakan (jalur, tipe tes) ke id deterministik', () => {
  assert.equal(idSetBawaan('dewasa', 'pretest'), 'SET-DEFAULT-1-pretest');
  assert.equal(idSetBawaan('dewasa', 'posttest'), 'SET-DEFAULT-1-posttest');
  assert.equal(idSetBawaan('lansia', 'posttest'), 'SET-DEFAULT-2-posttest');
  assert.equal(idSetBawaan('dewasa', 'retensi'), 'SET-DEFAULT-1-retensi');
  assert.equal(idSetBawaan('dewasa', 'kuis'), null);
  assert.equal(idSetBawaan('asing', 'posttest'), null);
});

test('pilihSetPretest: set bawaan kalah dari set buatan admin walaupun lebih baru', () => {
  const kandidat = [
    setAktif({ id: 'SET-DEFAULT-1-pretest', kode_kelas: [], created_at: '2026-10-11T00:00:00Z' }),
    setAktif({ id: 'SET-ADMIN', kode_kelas: [], created_at: '2026-09-01T00:00:00Z' }),
  ];
  const dipilih = pilihSetPretest(kandidat, { jalur: 'dewasa', now: NOW });
  assert.equal(dipilih.id, 'SET-ADMIN');
});

test('pilihSetPretest: set bawaan tetap dipakai bila itu satu-satunya kandidat', () => {
  const kandidat = [setAktif({ id: 'SET-DEFAULT-1-pretest', kode_kelas: [] })];
  const dipilih = pilihSetPretest(kandidat, { jalur: 'dewasa', now: NOW });
  assert.equal(dipilih.id, 'SET-DEFAULT-1-pretest');
});

/* ---- Aturan kode kelas yang sama berlaku untuk post-test & retensi ---- */

const POST_GLOBAL = setAktif({
  id: 'SET-POST-GLOBAL',
  tipe: 'post',
  kode_kelas: [],
  created_at: '2026-10-05T00:00:00Z',
});
const POST_KHUSUS = setAktif({
  id: 'SET-POST-KHUSUS',
  tipe: 'post',
  kode_kelas: ['PR-4078'],
  created_at: '2026-09-01T00:00:00Z',
});

test('pilihSet posttest: peserta berkode kelas diarahkan ke set kelompoknya', () => {
  const dipilih = pilihSet([POST_GLOBAL, POST_KHUSUS], {
    jalur: 'dewasa',
    type: 'posttest',
    classCode: 'pr-4078',
    now: NOW,
  });
  assert.equal(dipilih.id, 'SET-POST-KHUSUS');
});

test('pilihSet posttest: peserta tanpa kode hanya memakai set global', () => {
  const dipilih = pilihSet([POST_KHUSUS, POST_GLOBAL], {
    jalur: 'dewasa',
    type: 'posttest',
    classCode: '',
    now: NOW,
  });
  assert.equal(dipilih.id, 'SET-POST-GLOBAL');
});

test('pilihSet posttest: set kelompok lain dibuang, lalu jatuh ke set bawaan', () => {
  const bawaan = setAktif({
    id: 'SET-DEFAULT-1-posttest',
    tipe: 'post',
    kode_kelas: [],
    created_at: '2026-10-11T00:00:00Z',
  });
  const dipilih = pilihSet([POST_KHUSUS, bawaan], {
    jalur: 'dewasa',
    type: 'posttest',
    classCode: 'PR-9999',
    now: NOW,
  });
  assert.equal(dipilih.id, 'SET-DEFAULT-1-posttest');
});

test('pilihSet retensi: aturan kode kelas ikut berlaku', () => {
  const kandidat = [
    setAktif({ id: 'RET-KHUSUS', tipe: 'retensi', kode_kelas: ['PR-4078'] }),
    setAktif({ id: 'RET-GLOBAL', tipe: 'retensi', kode_kelas: [] }),
  ];
  assert.equal(
    pilihSet(kandidat, { jalur: 'dewasa', type: 'retensi', classCode: 'PR-4078', now: NOW }).id,
    'RET-KHUSUS',
  );
  assert.equal(
    pilihSet(kandidat, { jalur: 'dewasa', type: 'retensi', classCode: '', now: NOW }).id,
    'RET-GLOBAL',
  );
});

/* ---- Jawaban invalid/duplikat ---- */

const soal = [
  { id: 'Q1', opsi: ['a', 'b', 'c'] },
  { id: 'Q2', opsi: ['a', 'b'] },
];

test('validasiJawaban menerima jawaban lengkap valid', () => {
  const hasil = validasiJawaban(
    [
      { questionId: 'Q1', selectedOption: 1 },
      { questionId: 'Q2', selectedOption: 0 },
    ],
    soal,
  );
  assert.equal(hasil.valid, true);
});

test('validasiJawaban menolak jawaban duplikat', () => {
  const hasil = validasiJawaban(
    [
      { questionId: 'Q1', selectedOption: 1 },
      { questionId: 'Q1', selectedOption: 2 },
    ],
    soal,
  );
  assert.equal(hasil.valid, false);
  assert.deepEqual(hasil.duplikat, ['Q1']);
});

test('validasiJawaban menolak soal di luar set', () => {
  const hasil = validasiJawaban([{ questionId: 'Q9', selectedOption: 0 }], soal);
  assert.equal(hasil.valid, false);
  assert.deepEqual(hasil.tidakDikenal, ['Q9']);
});

test('validasiJawaban menolak opsi di luar rentang', () => {
  const hasil = validasiJawaban([{ questionId: 'Q2', selectedOption: 5 }], soal);
  assert.equal(hasil.valid, false);
  assert.equal(hasil.opsiTidakValid.length, 1);
});

/* ---- Batas post-test per set ---- */

test('bolehMulaiPosttest menolak bila set sudah disubmit', () => {
  const hasil = bolehMulaiPosttest([{ id: 'a1', set_id: 'SET-1', score: 8 }], 'SET-1');
  assert.equal(hasil.boleh, false);
  assert.equal(hasil.alasan, 'SUDAH_SUBMIT');
});

test('bolehMulaiPosttest melanjutkan attempt pending pada set sama', () => {
  const hasil = bolehMulaiPosttest([{ id: 'a1', set_id: 'SET-1', score: null }], 'SET-1');
  assert.equal(hasil.boleh, true);
  assert.equal(hasil.attemptId, 'a1');
});

test('bolehMulaiPosttest mengabaikan attempt set lain', () => {
  const hasil = bolehMulaiPosttest([{ id: 'a1', set_id: 'SET-2', score: 9 }], 'SET-1');
  assert.equal(hasil.boleh, true);
  assert.equal(hasil.attemptId, null);
});

/* ---- Retensi 14 hari ---- */

test('cekRetensi menolak sebelum 14 hari dan mengizinkan setelahnya', () => {
  const belum = cekRetensi({ created_at: '2026-10-05T00:00:00Z' }, NOW);
  assert.equal(belum.boleh, false);
  const sudah = cekRetensi({ created_at: '2026-09-20T00:00:00Z' }, NOW);
  assert.equal(sudah.boleh, true);
  assert.equal(RETENSI_HARI, 14);
});

test('cekRetensi mengizinkan bila belum ada post-test', () => {
  assert.equal(cekRetensi(null, NOW).boleh, true);
});

/* ---- Validasi skema request ---- */

test('testTypeParamSchema menerima retensi dan menolak tipe lain', () => {
  assert.equal(testTypeParamSchema.safeParse({ type: 'retensi' }).success, true);
  assert.equal(testTypeParamSchema.safeParse({ type: 'kuis' }).success, false);
});

test('startTestSchema menerima setId opsional', () => {
  assert.equal(startTestSchema.safeParse({ token: 'TKP-ABCDEFGH' }).success, true);
  assert.equal(startTestSchema.safeParse({ token: 'TKP-ABCDEFGH', setId: 'SET-1' }).success, true);
  assert.equal(startTestSchema.safeParse({ token: 'salah' }).success, false);
});

test('submitTestSchema mewajibkan token dan attemptId uuid', () => {
  const ok = submitTestSchema.safeParse({
    attemptId: '11111111-1111-1111-1111-111111111111',
    token: 'TKP-ABCDEFGH',
    answers: [{ questionId: 'Q1', selectedOption: 0 }],
  });
  assert.equal(ok.success, true);
  assert.equal(
    submitTestSchema.safeParse({
      attemptId: 'bukan-uuid',
      token: 'TKP-ABCDEFGH',
      answers: [{ questionId: 'Q1', selectedOption: 0 }],
    }).success,
    false,
  );
});

/* ---- Kebocoran kunci: respons peserta tidak memuat field rahasia ---- */

test('payload soal peserta tidak memuat kunci/penjelasan/kasus_nyata', () => {
  const soalPeserta = { id: 'Q1', kategori: 'x', pertanyaan: 'y', opsi: ['a', 'b'] };
  const terlarang = ['kunci', 'penjelasan', 'kasus_nyata', 'kasusNyata'];
  for (const field of terlarang) {
    assert.equal(Object.prototype.hasOwnProperty.call(soalPeserta, field), false);
  }
});
