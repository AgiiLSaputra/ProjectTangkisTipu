import test from 'node:test';
import assert from 'node:assert/strict';
import { __setQueryImpl } from '../src/config/db.js';
import { startTest, submitTest } from '../src/controllers/testsController.js';

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

// withTransaction memakai pool.connect(); kita tidak bisa memakai DB nyata.
// Untuk submitTest, kita suntikkan client palsu lewat pool.connect.
import { pool } from '../src/config/db.js';

const originalConnect = pool.connect.bind(pool);

function setQuery(impl) {
  __setQueryImpl(async (text, params) => impl(text, params));
}

function setClient(impl) {
  pool.connect = async () => ({
    query: async (text, params) => impl(text, params),
    release: () => {},
  });
}

test.after(() => {
  __setQueryImpl(null);
  pool.connect = originalConnect;
});

const SET_AKTIF = {
  id: 'SET-1',
  nama: 'Pre Dewasa',
  jalur: 'dewasa',
  tipe: 'pre',
  status: 'aktif',
  rilis_at: '2026-01-01',
  tutup_at: '2026-12-31',
  created_at: '2026-01-01T00:00:00Z',
};

const SOAL = [
  { id: 'Q1', kategori: 'OTP', pertanyaan: 'p1', opsi: ['a', 'b', 'c'], kunci: 1, penjelasan: 'e1', kasus_nyata: 'k1' },
  { id: 'Q2', kategori: 'OTP', pertanyaan: 'p2', opsi: ['a', 'b'], kunci: 0, penjelasan: 'e2', kasus_nyata: 'k2' },
];

/* ---- startTest ---- */

test('startTest: peserta tidak ditemukan -> 404 NOT_FOUND', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [] };
    return { rows: [] };
  });
  const res = mockRes();
  await startTest({ params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('startTest: set tidak tersedia -> 404 SET_NOT_AVAILABLE', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    if (text.includes('FROM question_sets')) return { rows: [] };
    return { rows: [] };
  });
  const res = mockRes();
  await startTest({ params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'SET_NOT_AVAILABLE');
});

test('startTest: sukses -> 201 tanpa field kunci pada soal', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    if (text.includes('FROM question_sets')) return { rows: [SET_AKTIF] };
    if (text.includes('FROM test_attempts')) return { rows: [] };
    // startTest mengecek jumlah soal set sebelum memakainya untuk pre-test.
    if (text.includes('COUNT(*)::int AS jumlah')) return { rows: [{ jumlah: SOAL.length }] };
    if (text.includes('FROM questions')) {
      return { rows: SOAL.map(({ kunci, penjelasan, kasus_nyata, ...rest }) => rest) };
    }
    if (text.includes('INSERT INTO test_attempts')) return { rows: [{ id: 'a1' }] };
    return { rows: [] };
  });
  const res = mockRes();
  await startTest({ params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.attemptId, 'a1');
  assert.equal(res.body.setId, 'SET-1');
  for (const q of res.body.questions) {
    assert.equal(Object.prototype.hasOwnProperty.call(q, 'kunci'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(q, 'penjelasan'), false);
  }
});

/* ---- startTest dengan setId eksplisit: status & jadwal wajib ditegakkan ---- */

test('startTest: setId draf -> 404 SET_NOT_AVAILABLE', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    if (text.includes('FROM question_sets')) return { rows: [{ ...SET_AKTIF, status: 'draf' }] };
    return { rows: [] };
  });
  const res = mockRes();
  await startTest(
    { params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH', setId: 'SET-1' } },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'SET_NOT_AVAILABLE');
});

test('startTest: setId terjadwal (belum rilis) -> 404 SET_NOT_AVAILABLE', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    if (text.includes('FROM question_sets')) {
      return { rows: [{ ...SET_AKTIF, status: 'terjadwal', rilis_at: '2099-01-01' }] };
    }
    return { rows: [] };
  });
  const res = mockRes();
  await startTest(
    { params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH', setId: 'SET-1' } },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'SET_NOT_AVAILABLE');
});

test('startTest: setId sudah tutup -> 404 SET_NOT_AVAILABLE', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    if (text.includes('FROM question_sets')) {
      return { rows: [{ ...SET_AKTIF, tutup_at: '2000-01-01' }] };
    }
    return { rows: [] };
  });
  const res = mockRes();
  await startTest(
    { params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH', setId: 'SET-1' } },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'SET_NOT_AVAILABLE');
});

test('startTest: setId aktif & dalam jadwal -> 201', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    if (text.includes('FROM question_sets')) return { rows: [SET_AKTIF] };
    if (text.includes('FROM test_attempts')) return { rows: [] };
    // startTest mengecek jumlah soal set sebelum memakainya untuk pre-test.
    if (text.includes('COUNT(*)::int AS jumlah')) return { rows: [{ jumlah: SOAL.length }] };
    if (text.includes('FROM questions')) {
      return { rows: SOAL.map(({ kunci, penjelasan, kasus_nyata, ...rest }) => rest) };
    }
    if (text.includes('INSERT INTO test_attempts')) return { rows: [{ id: 'a1' }] };
    return { rows: [] };
  });
  const res = mockRes();
  await startTest(
    { params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH', setId: 'SET-1' } },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-1');
});

/* ---- Aturan kode kelas & set bawaan pada pre-test ---- */

const SET_KHUSUS = {
  ...SET_AKTIF,
  id: 'SET-KHUSUS',
  kode_kelas: ['PR-4078'],
  created_at: '2026-10-11T00:00:00Z',
};
const SET_GLOBAL = { ...SET_AKTIF, id: 'SET-GLOBAL', kode_kelas: [] };
const SET_BAWAAN = {
  ...SET_AKTIF,
  id: 'SET-DEFAULT-1-pretest',
  nama: 'Pre-test Bawaan — dewasa',
  rilis_at: null,
  tutup_at: null,
  created_at: '2026-10-12T00:00:00Z',
  kode_kelas: [],
};
const SET_BAWAAN_POST = {
  ...SET_BAWAAN,
  id: 'SET-DEFAULT-1-posttest',
  nama: 'Post-test Bawaan — dewasa',
  tipe: 'post',
};
// Varian tipe 'post' untuk aturan kode kelas pada post-test.
const SET_KHUSUS_POST = { ...SET_KHUSUS, id: 'SET-KHUSUS-POST', nama: 'Post Kelompok', tipe: 'post' };
const SET_GLOBAL_POST = { ...SET_GLOBAL, id: 'SET-GLOBAL-POST', nama: 'Post Global', tipe: 'post' };

const tanpaKunci = ({ kunci, penjelasan, kasus_nyata, ...rest }) => rest;

// Mock alur startTest: kandidat set -> (opsional) provisioning set bawaan ->
// ambil soal & attempt.
// `jumlahAwal` = jumlah soal set pilihan admin; `jumlahBawaan` = jumlah soal
// set bawaan (dibedakan lewat params[0] yang berisi id set-nya).
function mockStartTest({
  peserta,
  kandidat = [],
  setBawaan = null,
  jumlahAwal = 10,
  jumlahBawaan = 10,
}) {
  return async (text, params) => {
    if (text.includes('FROM participants')) return { rows: [peserta] };
    if (text.includes('INSERT INTO question_sets')) return { rows: [] };
    if (text.includes('qs.jalur = $1')) return { rows: kandidat };
    if (text.includes('COUNT(*)::int AS jumlah')) {
      const idSet = String(params?.[0] ?? '');
      const jumlah = idSet.startsWith('SET-DEFAULT-') ? jumlahBawaan : jumlahAwal;
      return { rows: [{ jumlah }] };
    }
    if (text.includes('qs.id = $1')) return { rows: setBawaan ? [setBawaan] : [] };
    if (text.includes('FROM questions')) return { rows: SOAL.map(tanpaKunci) };
    if (text.includes('FROM test_attempts')) return { rows: [] };
    if (text.includes('INSERT INTO test_attempts')) return { rows: [{ id: 'a1' }] };
    return { rows: [] };
  };
}

test('startTest pretest: belum ada set admin -> memakai set bawaan global jalur', async () => {
  setQuery(
    mockStartTest({
      peserta: { id: 'p1', track: 1, class_code: null },
      setBawaan: SET_BAWAAN,
    }),
  );
  const res = mockRes();
  await startTest({ params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-DEFAULT-1-pretest');
  assert.equal(res.body.questions.length, SOAL.length);
});

test('startTest pretest: peserta tanpa kode kelas tidak mendapat set khusus komunitas', async () => {
  // Satu-satunya set tersedia terikat kode PR-4078 -> peserta mandiri tetap
  // mendapat pre-test lewat set bawaan, bukan set komunitas.
  setQuery(
    mockStartTest({
      peserta: { id: 'p1', track: 1, class_code: null },
      kandidat: [SET_KHUSUS],
      setBawaan: SET_BAWAAN,
    }),
  );
  const res = mockRes();
  await startTest({ params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-DEFAULT-1-pretest');
  assert.notEqual(res.body.setId, SET_KHUSUS.id);
});

test('startTest pretest: peserta dengan kode yang cocok memakai set khusus kelompoknya', async () => {
  setQuery(
    mockStartTest({
      peserta: { id: 'p1', track: 1, class_code: 'PR-4078' },
      kandidat: [SET_KHUSUS, SET_GLOBAL],
    }),
  );
  const res = mockRes();
  await startTest({ params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-KHUSUS');
});

test('startTest pretest: peserta tanpa kode memakai set global, bukan set khusus', async () => {
  setQuery(
    mockStartTest({
      peserta: { id: 'p1', track: 1, class_code: null },
      kandidat: [SET_KHUSUS, SET_GLOBAL],
    }),
  );
  const res = mockRes();
  await startTest({ params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-GLOBAL');
});

test('startTest pretest: set terpilih masih kosong tanpa soal -> dipindah ke set bawaan', async () => {
  setQuery(
    mockStartTest({
      peserta: { id: 'p1', track: 1, class_code: null },
      kandidat: [{ ...SET_AKTIF, id: 'SET-KOSONG', kode_kelas: [] }],
      setBawaan: SET_BAWAAN,
      jumlahAwal: 0,
    }),
  );
  const res = mockRes();
  await startTest({ params: { type: 'pretest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-DEFAULT-1-pretest');
});

test('startTest posttest: belum ada set admin -> set bawaan berisi soal pre-test', async () => {
  setQuery(
    mockStartTest({
      peserta: { id: 'p1', track: 1, class_code: null },
      setBawaan: SET_BAWAAN_POST,
    }),
  );
  const res = mockRes();
  await startTest({ params: { type: 'posttest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-DEFAULT-1-posttest');
  assert.equal(res.body.questions.length, SOAL.length);
});

test('startTest: posttest sudah disubmit -> 409 ATTEMPT_LIMIT_REACHED', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    if (text.includes('FROM question_sets')) {
      return { rows: [{ ...SET_AKTIF, tipe: 'post' }] };
    }
    // Cek jumlah soal set sebelum set dipakai untuk post-test.
    if (text.includes('COUNT(*)::int AS jumlah')) return { rows: [{ jumlah: SOAL.length }] };
    if (text.includes('FROM test_attempts')) {
      return { rows: [{ id: 'a1', set_id: 'SET-1', type: 'posttest', score: 8, created_at: 'x' }] };
    }
    return { rows: [] };
  });
  const res = mockRes();
  await startTest({ params: { type: 'posttest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error.code, 'ATTEMPT_LIMIT_REACHED');
});

/* ---- Aturan kode kelas berlaku sama untuk post-test ---- */

test('startTest posttest: peserta berkode kelas -> diarahkan ke set kelompoknya', async () => {
  setQuery(
    mockStartTest({
      peserta: { id: 'p1', track: 1, class_code: 'PR-4078' },
      kandidat: [SET_KHUSUS_POST, SET_GLOBAL_POST],
    }),
  );
  const res = mockRes();
  await startTest({ params: { type: 'posttest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-KHUSUS-POST');
});

test('startTest posttest: peserta tanpa kode tidak mendapat set khusus komunitas', async () => {
  setQuery(
    mockStartTest({
      peserta: { id: 'p1', track: 1, class_code: null },
      kandidat: [SET_KHUSUS_POST, SET_GLOBAL_POST],
    }),
  );
  const res = mockRes();
  await startTest({ params: { type: 'posttest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-GLOBAL-POST');
});

test('startTest posttest: kode kelompok lain -> jatuh ke set bawaan', async () => {
  setQuery(
    mockStartTest({
      peserta: { id: 'p1', track: 1, class_code: 'PR-9999' },
      kandidat: [SET_KHUSUS_POST],
      setBawaan: SET_BAWAAN_POST,
    }),
  );
  const res = mockRes();
  await startTest({ params: { type: 'posttest' }, body: { token: 'TKP-ABCDEFGH' } }, res, (e) => {
    throw e;
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setId, 'SET-DEFAULT-1-posttest');
});

test('startTest: setId eksplisit terikat kode kelas lain -> 404 SET_NOT_AVAILABLE', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) {
      return { rows: [{ id: 'p1', track: 1, class_code: 'PR-9999' }] };
    }
    if (text.includes('FROM question_sets')) return { rows: [{ ...SET_KHUSUS_POST }] };
    return { rows: [] };
  });
  const res = mockRes();
  await startTest(
    { params: { type: 'posttest' }, body: { token: 'TKP-ABCDEFGH', setId: 'SET-KHUSUS-POST' } },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'SET_NOT_AVAILABLE');
});

/* ---- submitTest ---- */

test('submitTest: peserta tidak ditemukan -> 404 NOT_FOUND', async () => {
  setQuery(async () => ({ rows: [] }));
  const res = mockRes();
  await submitTest(
    {
      params: { type: 'pretest' },
      body: { attemptId: '11111111-1111-1111-1111-111111111111', token: 'TKP-ABCDEFGH', answers: [{ questionId: 'Q1', selectedOption: 1 }] },
    },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('submitTest: attempt bukan milik peserta -> 403 FORBIDDEN', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    return { rows: [] };
  });
  setClient(async (text) => {
    if (text.includes('FROM test_attempts')) {
      return { rows: [{ id: 'a1', participant_id: 'p2', type: 'pretest', set_id: 'SET-1', score: null }] };
    }
    return { rows: [] };
  });
  const res = mockRes();
  await submitTest(
    {
      params: { type: 'pretest' },
      body: { attemptId: '11111111-1111-1111-1111-111111111111', token: 'TKP-ABCDEFGH', answers: [{ questionId: 'Q1', selectedOption: 1 }] },
    },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error.code, 'FORBIDDEN');
});

test('submitTest: attempt sudah disubmit -> 409 ALREADY_SUBMITTED', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    return { rows: [] };
  });
  setClient(async (text) => {
    if (text.includes('FROM test_attempts')) {
      return { rows: [{ id: 'a1', participant_id: 'p1', type: 'pretest', set_id: 'SET-1', score: 7 }] };
    }
    return { rows: [] };
  });
  const res = mockRes();
  await submitTest(
    {
      params: { type: 'pretest' },
      body: { attemptId: '11111111-1111-1111-1111-111111111111', token: 'TKP-ABCDEFGH', answers: [{ questionId: 'Q1', selectedOption: 1 }] },
    },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.error.code, 'ALREADY_SUBMITTED');
});

test('submitTest: jawaban duplikat -> 400 INVALID_ANSWERS', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    return { rows: [] };
  });
  setClient(async (text) => {
    if (text.includes('FROM test_attempts')) {
      return { rows: [{ id: 'a1', participant_id: 'p1', type: 'pretest', set_id: 'SET-1', score: null }] };
    }
    if (text.includes('FROM question_sets')) return { rows: [{ id: 'SET-1', status: 'aktif', rilis_at: null, tutup_at: null }] };
    if (text.includes('FROM questions')) return { rows: SOAL };
    return { rows: [] };
  });
  const res = mockRes();
  await submitTest(
    {
      params: { type: 'pretest' },
      body: {
        attemptId: '11111111-1111-1111-1111-111111111111',
        token: 'TKP-ABCDEFGH',
        answers: [
          { questionId: 'Q1', selectedOption: 1 },
          { questionId: 'Q1', selectedOption: 0 },
        ],
      },
    },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, 'INVALID_ANSWERS');
});

test('submitTest: sukses -> 200 skor dihitung server dan penjelasan dikirim', async () => {
  setQuery(async (text) => {
    if (text.includes('FROM participants')) return { rows: [{ id: 'p1', track: 1 }] };
    return { rows: [] };
  });
  setClient(async (text) => {
    if (text.includes('FROM test_attempts')) {
      return { rows: [{ id: 'a1', participant_id: 'p1', type: 'pretest', set_id: 'SET-1', score: null }] };
    }
    if (text.includes('FROM question_sets')) return { rows: [{ id: 'SET-1', status: 'aktif', rilis_at: null, tutup_at: null }] };
    if (text.includes('FROM questions')) return { rows: SOAL };
    if (text.includes('UPDATE test_attempts')) return { rows: [{ id: 'a1' }] };
    return { rows: [] };
  });
  const res = mockRes();
  await submitTest(
    {
      params: { type: 'pretest' },
      body: {
        attemptId: '11111111-1111-1111-1111-111111111111',
        token: 'TKP-ABCDEFGH',
        answers: [
          { questionId: 'Q1', selectedOption: 1 },
          { questionId: 'Q2', selectedOption: 1 },
        ],
      },
    },
    res,
    (e) => {
      throw e;
    },
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.score, 1);
  assert.equal(res.body.total, 2);
  assert.equal(res.body.details[0].penjelasan, 'e1');
  assert.equal(res.body.details[0].kasusNyata, 'k1');
});
