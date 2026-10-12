import { z } from 'zod';
import { query, withTransaction } from '../config/db.js';
import { evaluate } from '../services/scoringService.js';
import {
  pilihSet,
  idSetBawaan,
  setTersediaUntukPeserta,
  validasiJawaban,
  bolehMulaiPosttest,
  cekRetensi,
  tipeSetDariTes,
  trackDariJalur,
  JALUR_KE_TRACK,
} from '../services/setSelectionService.js';

const TEST_TYPES = ['pretest', 'posttest', 'retensi'];

export const testTypeParamSchema = z.object({
  type: z.enum(TEST_TYPES, { message: 'Tipe tes harus "pretest", "posttest", atau "retensi".' }),
});

export const startTestSchema = z
  .object({
    token: z.string().trim().regex(/^TKP-[A-Z0-9]{8}$/, 'Format token tidak valid'),
    setId: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const submitTestSchema = z
  .object({
    attemptId: z.string().uuid('attemptId tidak valid'),
    token: z.string().trim().regex(/^TKP-[A-Z0-9]{8}$/, 'Format token tidak valid'),
    answers: z
      .array(
        z.object({
          questionId: z.string().trim().min(1),
          selectedOption: z.coerce.number().int().min(0),
        }),
      )
      .min(1, 'Jawaban tidak boleh kosong'),
  })
  .strict();

export const resultsTokenParamSchema = z.object({
  token: z.string().trim().regex(/^TKP-[A-Z0-9]{8}$/, 'Format token tidak valid'),
});

async function findParticipant(token) {
  const { rows } = await query(
    'SELECT id, track, class_code FROM participants WHERE token = $1 LIMIT 1',
    [token],
  );
  return rows.length > 0 ? rows[0] : null;
}

// Kode kelas set (many-to-many lewat set_class_codes) dikumpulkan jadi array.
// Dipakai pemilihan set untuk membedakan set global vs set khusus kelas.
const KOLOM_KODE_KELAS = `
       COALESCE((
         SELECT array_agg(s.code ORDER BY s.code)
           FROM set_class_codes s
          WHERE s.set_id = qs.id
       ), '{}'::text[]) AS kode_kelas`;

// Ambil kandidat set untuk jalur peserta + tipe tes, lalu pilih yang aktif & dalam
// jadwal sesuai aturan kode kelas. Aturan ini berlaku sama rata untuk pre-test,
// post-test, dan retensi — supaya peserta yang mengisi kode kelas selalu diarahkan
// ke set milik kelompoknya, dan peserta mandiri hanya memakai set global.
async function ambilSetAktif(jalur, type, setId, classCode = '') {
  const tipeSet = tipeSetDariTes(type);
  if (!tipeSet) return null;

  if (setId) {
    const { rows } = await query(
      `SELECT qs.id, qs.nama, qs.jalur, qs.tipe, qs.status, qs.rilis_at, qs.tutup_at, qs.created_at,
              ${KOLOM_KODE_KELAS}
         FROM question_sets qs WHERE qs.id = $1 LIMIT 1`,
      [setId],
    );
    const set = rows[0];
    if (!set) return null;
    // Set eksplisit tetap harus lolos aturan kode kelas (mencegah peserta
    // menyasar set kelompok lain) sekaligus validasi jalur/tipe/status/jadwal.
    return pilihSet([set], { jalur, type, classCode });
  }

  const { rows } = await query(
    `SELECT qs.id, qs.nama, qs.jalur, qs.tipe, qs.status, qs.rilis_at, qs.tutup_at, qs.created_at,
            ${KOLOM_KODE_KELAS}
       FROM question_sets qs
      WHERE qs.jalur = $1 AND qs.tipe = $2`,
    [jalur, tipeSet],
  );
  return pilihSet(rows, { jalur, type, classCode });
}

// Jumlah soal aktif pada sebuah set. Dipakai untuk memastikan set yang terpilih
// benar-benar berisi soal (set masih kosong = tidak bisa dipakai peserta).
async function jumlahSoalSet(setId) {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS jumlah FROM questions WHERE set_id = $1 AND active = TRUE`,
    [setId],
  );
  return rows[0]?.jumlah ?? 0;
}

// Info singkat per tipe tes yang didukung set bawaan.
const INFO_TES = {
  pretest: { tipeSet: 'pre', judul: 'Pre-test' },
  posttest: { tipeSet: 'post', judul: 'Post-test' },
};

// Set bawaan: dibuat otomatis saat tidak ada satu pun set <tes> yang bisa dipakai
// peserta (admin/komunitas belum membuat, atau set yang ada terikat kode kelas
// yang tidak dimiliki peserta). Bersifat global (tanpa kode kelas) sehingga
// peserta belajar mandiri selalu bisa mengerjakan tes.
// Soalnya selalu diambil dari bank soal pre-test jalur yang sama — post-test
// memakai soal yang sama dengan pre-test.
async function pastikanSetBawaan(jalur, type) {
  const info = INFO_TES[type];
  const setId = idSetBawaan(jalur, type);
  const track = JALUR_KE_TRACK[jalur];
  if (!info || !setId || track === undefined) return null;

  // 1) Buat set default (status aktif, tanpa jadwal & tanpa kode kelas).
  //    Bila sudah ada tapi bukan 'aktif', aktifkan kembali — provisioning ini
  //    hanya dipanggil ketika tidak ada set <tes> lain yang tersedia.
  await query(
    `INSERT INTO question_sets (id, nama, catatan, jalur, tipe, status)
     VALUES ($1, $2, $3, $4, $5, 'aktif')
     ON CONFLICT (id) DO UPDATE SET status = 'aktif'
     WHERE question_sets.status <> 'aktif'`,
    [
      setId,
      `${info.judul} Bawaan — ${jalur}`,
      'Dibuat otomatis sistem untuk peserta yang belum punya set/kode kelas.',
      jalur,
      info.tipeSet,
    ],
  );

  // 2) Adopsi soal lama yang belum terikat set apa pun. Hanya untuk pre-test,
  //    karena soal bertipe pretest memang milik set pre-test. Post-test tidak
  //    mengadopsi — nanti disalin dari bank soal pre-test.
  if (type === 'pretest') {
    await query(
      `UPDATE questions SET set_id = $1
        WHERE track = $2 AND type = 'pretest' AND set_id IS NULL`,
      [setId, track],
    );
  }

  // 3) Bila set bawaan masih kosong, salin bank soal pre-test jalur ini ke sana.
  //    (Soal milik set admin tidak disentuh — hanya disalin.)
  if ((await jumlahSoalSet(setId)) === 0) {
    const { rows: bank } = await query(
      `SELECT id, kategori, pertanyaan, opsi, kunci, penjelasan, kasus_nyata
         FROM questions
        WHERE track = $1 AND type = 'pretest' AND active = TRUE
        ORDER BY created_at ASC, id ASC
        LIMIT 10`,
      [track],
    );
    for (const q of bank) {
      // Id salinan memakai pola '<setId>#<idAsli>' agar mudah dibedakan dari soal asli.
      await query(
        `INSERT INTO questions (id, track, type, kategori, pertanyaan, opsi, kunci, penjelasan, kasus_nyata, set_id)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          `${setId}#${q.id}`,
          track,
          type,
          q.kategori,
          q.pertanyaan,
          JSON.stringify(q.opsi),
          q.kunci,
          q.penjelasan,
          q.kasus_nyata,
          setId,
        ],
      );
    }
  }

  // 4) Bila set bawaan tetap kosong (bank soal jalur ini pun tidak ada),
  //    anggap gagal supaya peserta mendapat pesan "set soal belum tersedia".
  if ((await jumlahSoalSet(setId)) === 0) return null;

  // 5) Ambil kembali set bawaan beserta daftar kode kelasnya (harusnya kosong).
  const { rows } = await query(
    `SELECT qs.id, qs.nama, qs.jalur, qs.tipe, qs.status, qs.rilis_at, qs.tutup_at, qs.created_at,
            ${KOLOM_KODE_KELAS}
       FROM question_sets qs WHERE qs.id = $1 LIMIT 1`,
    [setId],
  );
  const set = rows[0];
  return set && setTersediaUntukPeserta(set) ? set : null;
}

async function ambilSoalSet(setId) {
  const { rows } = await query(
    `SELECT id, kategori, pertanyaan, opsi
     FROM questions
     WHERE set_id = $1 AND active = TRUE
     ORDER BY created_at ASC, id ASC
     LIMIT 10`,
    [setId],
  );
  return rows;
}

export async function startTest(req, res, next) {
  try {
    const { type } = req.params;
    const { token, setId } = req.body;

    const participant = await findParticipant(token);
    if (!participant) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Peserta tidak ditemukan.' },
      });
    }

    const jalur = Object.entries({ 0: 'anak', 1: 'dewasa', 2: 'lansia' }).find(
      ([k]) => Number(k) === participant.track,
    )?.[1];
    if (!jalur) {
      return res.status(400).json({
        error: { code: 'INVALID_TRACK', message: 'Jalur peserta tidak dikenali.' },
      });
    }

    let set = await ambilSetAktif(jalur, type, setId, participant.class_code ?? '');
    // Pre-test & post-test selalu bisa dibuka: bila tidak ada set yang cocok
    // (admin/komunitas belum membuat, atau set yang ada terikat kode kelas yang
    // tidak dimiliki peserta), ATAU set yang terpilih masih kosong tanpa soal —
    // pakai set bawaan global jalur tersebut (soalnya dari bank soal pre-test).
    if (
      (type === 'pretest' || type === 'posttest') &&
      !setId &&
      (!set || (await jumlahSoalSet(set.id)) === 0)
    ) {
      set = await pastikanSetBawaan(jalur, type);
    }
    if (!set) {
      return res.status(404).json({
        error: {
          code: 'SET_NOT_AVAILABLE',
          message: 'Set soal belum tersedia atau belum masuk jadwal.',
        },
      });
    }

    const { rows: attempts } = await query(
      `SELECT id, set_id, type, score, created_at
       FROM test_attempts
       WHERE participant_id = $1 AND set_id = $2
       ORDER BY created_at ASC`,
      [participant.id, set.id],
    );

    let attemptId = null;

    if (type === 'posttest') {
      const cek = bolehMulaiPosttest(attempts, set.id);
      if (!cek.boleh) {
        return res.status(409).json({
          error: {
            code: 'ATTEMPT_LIMIT_REACHED',
            message: 'Post-test hanya dapat dikerjakan satu kali per set.',
          },
        });
      }
      attemptId = cek.attemptId;
    } else if (type === 'retensi') {
      // Retensi hanya boleh setelah 14 hari sejak submit post-test terakhir.
      const { rows: postRows } = await query(
        `SELECT id, score, created_at FROM test_attempts
         WHERE participant_id = $1 AND type = 'posttest' AND score IS NOT NULL
         ORDER BY created_at DESC LIMIT 1`,
        [participant.id],
      );
      const cek = cekRetensi(postRows[0]);
      if (!cek.boleh) {
        return res.status(409).json({
          error: {
            code: 'RETENSI_BELUM_TIBA',
            message: 'Tes ulang baru tersedia setelah 14 hari sejak post-test terakhir.',
            tersediaPada: cek.tersediaPada ? cek.tersediaPada.toISOString() : null,
          },
        });
      }
      const pending = attempts.find((a) => a.score === null);
      attemptId = pending ? pending.id : null;
    } else {
      // Pretest boleh diulang: lanjutkan attempt pending bila ada.
      const pending = attempts.find((a) => a.score === null);
      attemptId = pending ? pending.id : null;
    }

    const questions = await ambilSoalSet(set.id);
    if (questions.length === 0) {
      return res.status(404).json({
        error: { code: 'QUESTIONS_NOT_AVAILABLE', message: 'Soal pada set ini belum tersedia.' },
      });
    }

    if (!attemptId) {
      const { rows: attemptRows } = await query(
        `INSERT INTO test_attempts (participant_id, type, set_id)
         VALUES ($1, $2, $3) RETURNING id`,
        [participant.id, type, set.id],
      );
      attemptId = attemptRows[0].id;
    }

    // Respons peserta: tanpa kunci/penjelasan/kasus_nyata.
    res.status(201).json({
      attemptId,
      type,
      track: participant.track,
      setId: set.id,
      setNama: set.nama,
      questions: questions.map((q) => ({
        id: q.id,
        kategori: q.kategori,
        pertanyaan: q.pertanyaan,
        opsi: q.opsi,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function submitTest(req, res, next) {
  try {
    const { type } = req.params;
    const { attemptId, token, answers } = req.body;

    const participant = await findParticipant(token);
    if (!participant) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Peserta tidak ditemukan.' },
      });
    }

    const outcome = await withTransaction(async (client) => {
      // Klaim attempt secara atomik: hanya attempt milik peserta, belum disubmit.
      const { rows: attemptRows } = await client.query(
        `SELECT id, participant_id, type, set_id, score
         FROM test_attempts WHERE id = $1 FOR UPDATE`,
        [attemptId],
      );

      if (attemptRows.length === 0) {
        return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Attempt tidak ditemukan.' } } };
      }

      const attempt = attemptRows[0];

      if (attempt.participant_id !== participant.id) {
        return { status: 403, body: { error: { code: 'FORBIDDEN', message: 'Attempt ini bukan milik peserta.' } } };
      }

      if (attempt.type !== type) {
        return { status: 400, body: { error: { code: 'TYPE_MISMATCH', message: 'Tipe tes tidak sesuai dengan attempt.' } } };
      }

      if (attempt.score !== null) {
        return { status: 409, body: { error: { code: 'ALREADY_SUBMITTED', message: 'Attempt ini sudah pernah disubmit.' } } };
      }

      if (!attempt.set_id) {
        return { status: 409, body: { error: { code: 'SET_MISSING', message: 'Attempt tidak terikat set soal.' } } };
      }

      // Soal harus berasal dari set attempt, aktif, dan set masih dalam jadwal.
      const { rows: setRows } = await client.query(
        `SELECT id, status, rilis_at, tutup_at FROM question_sets WHERE id = $1 LIMIT 1`,
        [attempt.set_id],
      );
      const set = setRows[0];
      if (!set) {
        return { status: 409, body: { error: { code: 'SET_NOT_AVAILABLE', message: 'Set soal tidak ditemukan.' } } };
      }

      const { rows: questions } = await client.query(
        `SELECT id, kategori, opsi, kunci, penjelasan, kasus_nyata
         FROM questions
         WHERE set_id = $1 AND active = TRUE
         ORDER BY created_at ASC, id ASC
         LIMIT 10`,
        [attempt.set_id],
      );

      if (questions.length === 0) {
        return { status: 409, body: { error: { code: 'QUESTIONS_NOT_AVAILABLE', message: 'Soal pada set ini tidak tersedia.' } } };
      }

      const cek = validasiJawaban(answers, questions);
      if (!cek.valid) {
        const details = [];
        if (cek.duplikat.length > 0) {
          details.push({ field: 'answers', message: `Jawaban duplikat: ${cek.duplikat.join(', ')}` });
        }
        if (cek.tidakDikenal.length > 0) {
          details.push({ field: 'answers', message: `Soal bukan bagian set ini: ${cek.tidakDikenal.join(', ')}` });
        }
        if (cek.opsiTidakValid.length > 0) {
          details.push({ field: 'answers', message: 'Pilihan jawaban di luar rentang opsi.' });
        }
        return {
          status: 400,
          body: { error: { code: 'INVALID_ANSWERS', message: 'Jawaban tidak valid.', details } },
        };
      }

      const result = evaluate(questions, answers, type);
      const detailMap = new Map(result.details.map((d) => [String(d.questionId), d]));

      for (const q of questions) {
        const d = detailMap.get(String(q.id));
        await client.query(
          `INSERT INTO answers (attempt_id, question_id, selected_option, is_correct)
           VALUES ($1, $2, $3, $4)`,
          [attemptId, q.id, d?.selectedOption ?? null, d?.isCorrect ?? false],
        );
      }

      // Update atomik: hanya bila belum disubmit (cegah submit ganda bersamaan).
      const { rows: updated } = await client.query(
        `UPDATE test_attempts SET score = $1, passed = $2
         WHERE id = $3 AND score IS NULL RETURNING id`,
        [result.score, result.passed, attemptId],
      );
      if (updated.length === 0) {
        return { status: 409, body: { error: { code: 'ALREADY_SUBMITTED', message: 'Attempt ini sudah pernah disubmit.' } } };
      }

      if (type === 'pretest') {
        await client.query(
          `INSERT INTO progress (participant_id, pretest_score)
           VALUES ($1, $2)
           ON CONFLICT (participant_id) DO UPDATE SET
             pretest_score = EXCLUDED.pretest_score,
             updated_at    = NOW()`,
          [attempt.participant_id, result.score],
        );
      } else if (type === 'posttest') {
        await client.query(
          `INSERT INTO progress (participant_id, posttest_score)
           VALUES ($1, $2)
           ON CONFLICT (participant_id) DO UPDATE SET
             posttest_score = EXCLUDED.posttest_score,
             updated_at     = NOW()`,
          [attempt.participant_id, result.score],
        );
      }

      return {
        status: 200,
        body: {
          attemptId,
          type,
          setId: attempt.set_id,
          score: result.score,
          total: result.total,
          passed: result.passed,
          details: questions.map((q) => {
            const d = detailMap.get(String(q.id));
            return {
              questionId: q.id,
              selectedOption: d?.selectedOption ?? null,
              isCorrect: d?.isCorrect ?? false,
              penjelasan: q.penjelasan,
              kasusNyata: q.kasus_nyata,
            };
          }),
        },
      };
    });

    res.status(outcome.status).json(outcome.body);
  } catch (err) {
    next(err);
  }
}

export async function getResults(req, res, next) {
  try {
    const { token } = req.params;

    const participant = await findParticipant(token);
    if (!participant) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Peserta tidak ditemukan.' },
      });
    }

    // Hanya attempt milik peserta ini yang sudah dinilai server (score IS NOT NULL).
    // Skor selalu berasal dari test_attempts, bukan nilai kiriman klien.
    const { rows: attempts } = await query(
      `SELECT ta.id, ta.type, ta.set_id, ta.score, ta.passed, ta.created_at,
              qs.nama AS set_nama
       FROM test_attempts ta
       LEFT JOIN question_sets qs ON qs.id = ta.set_id
       WHERE ta.participant_id = $1 AND ta.score IS NOT NULL
       ORDER BY ta.created_at ASC`,
      [participant.id],
    );

    const { rows: categoryRows } = await query(
      `SELECT q.kategori,
              COUNT(*)::int AS total,
              SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS correct
       FROM answers a
       JOIN test_attempts ta ON ta.id = a.attempt_id
       JOIN questions q ON q.id = a.question_id
       WHERE ta.participant_id = $1
       GROUP BY q.kategori
       ORDER BY q.kategori ASC`,
      [participant.id],
    );

    // Ringkasan per tipe tes (pre/post/retensi) dari attempt yang sudah dinilai.
    const byType = {};
    for (const a of attempts) {
      const entry = byType[a.type] ?? { attempts: 0, bestScore: null, lastScore: null, passed: false };
      entry.attempts += 1;
      entry.lastScore = a.score;
      entry.bestScore = entry.bestScore === null ? a.score : Math.max(entry.bestScore, a.score);
      entry.passed = entry.passed || a.passed === true;
      byType[a.type] = entry;
    }

    res.json({
      token,
      attempts: attempts.map((a) => ({
        attemptId: a.id,
        type: a.type,
        setId: a.set_id,
        setNama: a.set_nama ?? null,
        score: a.score,
        passed: a.passed,
        createdAt: a.created_at,
      })),
      summary: {
        byCategory: categoryRows.map((c) => ({
          kategori: c.kategori,
          correct: c.correct,
          total: c.total,
        })),
        byType,
      },
    });
  } catch (err) {
    next(err);
  }
}

export default { startTest, submitTest, getResults };
