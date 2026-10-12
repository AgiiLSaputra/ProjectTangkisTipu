# BE-01 — Audit Skema Database dan Kebutuhan Migrasi

Status: laporan audit (read-only). Tidak ada perubahan kode/SQL/konfigurasi/database.
Tanggal audit: sesi BE-01. Referensi: `Backend/TASK.md` (BE-01), `Frontend/PRD-TangkisTipu.md`, `Frontend/src/data/setSoal.js`, `Frontend/src/data/kodeKelas.js`, komponen admin frontend.

Konvensi label pada laporan ini:
- **[FAKTA]** — didukung langsung oleh file/baris kode atau nama migrasi.
- **[REKOMENDASI]** — usulan, belum diterapkan.
- **[ASUMSI]** — dugaan yang perlu dikonfirmasi; tidak boleh dijadikan dasar perubahan destruktif.

---

## 1. Ringkasan hasil audit

- **[FAKTA]** Skema aktual terdiri dari 5 tabel: `class_codes`, `participants`, `progress`, `questions`, `test_attempts`, `answers` (6 tabel total) dari `001_init.sql`, ditambah satu perubahan kolom di `002_answers_nullable.sql`.
- **[FAKTA]** Belum ada entitas "set soal". Soal (`questions`) hanya dikaitkan ke `track` + `type`; attempt (`test_attempts`) hanya menyimpan `type` (`pretest`/`posttest`), tanpa identitas set.
- **[FAKTA]** Belum ada tabel/endpoint akun admin, login, atau proteksi route admin.
- **[FAKTA]** Kode kelas hanya punya endpoint validasi (`POST /api/class-codes/validate`); belum ada CRUD/list/detail/status.
- **[FAKTA]** Belum ada endpoint agregasi statistik admin/kelompok.
- **[FAKTA]** Runner migrasi (`migrate.js`) mengeksekusi ulang **semua** file `.sql` setiap kali dijalankan, tanpa tabel pelacak migrasi. Aman saat ini karena semua statement memakai `IF NOT EXISTS`/`DROP NOT NULL`, tetapi berisiko untuk migrasi additive berikutnya yang tidak idempoten.
- **[FAKTA]** `npm test` dari `Backend/` lulus 4/4 tes scoring (tanpa koneksi database).
- **[REKOMENDASI]** Perubahan berikutnya harus additive (migrasi `003+`), tanpa menghapus/mengubah migrasi lama, dan runner perlu tabel pelacak migrasi sebelum menambah migrasi non-idempoten.

---

## 2. Skema database saat ini

Sumber: [`001_init.sql`](Backend/src/db/migrations/001_init.sql:1) dan [`002_answers_nullable.sql`](Backend/src/db/migrations/002_answers_nullable.sql:1).

### 2.1 `class_codes` — [`001_init.sql:5`](Backend/src/db/migrations/001_init.sql:5)
| Kolom | Tipe | Constraint |
|---|---|---|
| `code` | TEXT | PRIMARY KEY |
| `label` | TEXT | nullable |
| `active` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

### 2.2 `participants` — [`001_init.sql:12`](Backend/src/db/migrations/001_init.sql:12)
| Kolom | Tipe | Constraint |
|---|---|---|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| `token` | TEXT | NOT NULL UNIQUE |
| `nickname` | TEXT | nullable |
| `track` | INT | NOT NULL DEFAULT 1, CHECK (track BETWEEN 0 AND 2) |
| `class_code` | TEXT | FK → `class_codes(code)` ON UPDATE CASCADE ON DELETE SET NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

Index: `idx_participants_token` pada `(token)` — [`001_init.sql:21`](Backend/src/db/migrations/001_init.sql:21).

### 2.3 `progress` — [`001_init.sql:23`](Backend/src/db/migrations/001_init.sql:23)
| Kolom | Tipe | Constraint |
|---|---|---|
| `participant_id` | UUID | PRIMARY KEY, FK → `participants(id)` ON DELETE CASCADE |
| `pretest_score` | INT | nullable |
| `modus_dibaca` | INT | NOT NULL DEFAULT 0 |
| `skenario` | INT | NOT NULL DEFAULT 0 |
| `posttest_score` | INT | nullable |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

Relasi: 1 peserta ↔ 1 baris progres (PK = FK).

### 2.4 `questions` — [`001_init.sql:32`](Backend/src/db/migrations/001_init.sql:32)
| Kolom | Tipe | Constraint |
|---|---|---|
| `id` | TEXT | PRIMARY KEY |
| `track` | INT | NOT NULL, CHECK (track BETWEEN 0 AND 2) |
| `type` | TEXT | NOT NULL DEFAULT 'pretest' (tanpa CHECK) |
| `kategori` | TEXT | nullable |
| `pertanyaan` | TEXT | NOT NULL |
| `opsi` | JSONB | NOT NULL DEFAULT '[]' |
| `kunci` | INT | NOT NULL |
| `penjelasan` | TEXT | nullable |
| `kasus_nyata` | TEXT | nullable |
| `active` | BOOLEAN | NOT NULL DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

Index: `idx_questions_track_type` pada `(track, type)` — [`001_init.sql:46`](Backend/src/db/migrations/001_init.sql:46).
Catatan: `type` tidak punya CHECK, sehingga nilai bebas (mis. `retensi`) bisa masuk tanpa perubahan skema, tetapi tidak ada relasi ke set.

### 2.5 `test_attempts` — [`001_init.sql:48`](Backend/src/db/migrations/001_init.sql:48)
| Kolom | Tipe | Constraint |
|---|---|---|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| `participant_id` | UUID | NOT NULL, FK → `participants(id)` ON DELETE CASCADE |
| `type` | TEXT | NOT NULL, CHECK (type IN ('pretest','posttest')) |
| `score` | INT | nullable (NULL = belum disubmit) |
| `passed` | BOOLEAN | NOT NULL DEFAULT FALSE |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() |

Index: `idx_test_attempts_participant` pada `(participant_id)` — [`001_init.sql:57`](Backend/src/db/migrations/001_init.sql:57).
Catatan: CHECK `type` membatasi hanya `pretest`/`posttest`; tipe `retensi` tidak didukung tanpa migrasi.

### 2.6 `answers` — [`001_init.sql:59`](Backend/src/db/migrations/001_init.sql:59)
| Kolom | Tipe | Constraint |
|---|---|---|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() |
| `attempt_id` | UUID | NOT NULL, FK → `test_attempts(id)` ON DELETE CASCADE |
| `question_id` | TEXT | NOT NULL, FK → `questions(id)` ON UPDATE CASCADE ON DELETE RESTRICT |
| `selected_option` | INT | **nullable** (setelah `002`) |
| `is_correct` | BOOLEAN | NOT NULL DEFAULT FALSE |

Index: `idx_answers_attempt` pada `(attempt_id)` — [`001_init.sql:67`](Backend/src/db/migrations/001_init.sql:67).
Perubahan `002`: `ALTER TABLE answers ALTER COLUMN selected_option DROP NOT NULL;` — [`002_answers_nullable.sql:2`](Backend/src/db/migrations/002_answers_nullable.sql:2).

### 2.7 Ringkasan relasi (ERD ringkas)
```
class_codes (code) 1 ──< participants (class_code)   [ON DELETE SET NULL]
participants (id)  1 ──1 progress (participant_id)   [ON DELETE CASCADE]
participants (id)  1 ──< test_attempts (participant_id) [ON DELETE CASCADE]
test_attempts (id) 1 ──< answers (attempt_id)        [ON DELETE CASCADE]
questions (id)     1 ──< answers (question_id)       [ON DELETE RESTRICT]
```
Tidak ada relasi antara `questions` dan `test_attempts` selain lewat `answers`.

---

## 3. Peta endpoint saat ini dan tabel yang digunakan

Sumber route: [`app.js:27`](Backend/src/app.js:27) dan file `routes/*`.

| Endpoint | Handler | Tabel yang dibaca/ditulis | Catatan |
|---|---|---|---|
| `GET /health` | inline [`app.js:23`](Backend/src/app.js:23) | — | tanpa DB |
| `POST /api/participants` | [`createParticipant`](Backend/src/controllers/participantsController.js:15) | SELECT `class_codes`; INSERT `participants`; INSERT `progress` | validasi kode kelas aktif |
| `GET /api/participants/:token` | [`getParticipant`](Backend/src/controllers/participantsController.js:68) | SELECT `participants` | `tokenLimiter` terpasang |
| `POST /api/class-codes/validate` | [`validateClassCode`](Backend/src/controllers/classCodesController.js:8) | SELECT `class_codes` | hanya validasi |
| `GET /api/modules` | [`listModules`](Backend/src/controllers/modulesController.js:19) | — (array statis) | 1 modul hard-coded |
| `GET /api/modules/:id` | [`getModule`](Backend/src/controllers/modulesController.js:23) | — (array statis) | 1 modul hard-coded |
| `GET /api/progress/:token` | [`getProgress`](Backend/src/controllers/progressController.js:33) | SELECT `participants`, `progress` | `tokenLimiter` terpasang |
| `PATCH /api/progress/:token` | [`updateProgress`](Backend/src/controllers/progressController.js:62) | SELECT `participants`; UPSERT `progress` | hanya `modusDibaca`/`skenario`, pakai `GREATEST` (tidak bisa turun) |
| `POST /api/tests/:type/start` | [`startTest`](Backend/src/controllers/testsController.js:43) | SELECT `participants`, `test_attempts`, `questions`; INSERT `test_attempts` | `type` ∈ {pretest, posttest} |
| `POST /api/tests/:type/submit` | [`submitTest`](Backend/src/controllers/testsController.js:126) | `withTransaction`: SELECT/UPDATE `test_attempts`; SELECT `questions`; INSERT `answers`; UPSERT `progress` | skor dihitung server |
| `GET /api/tests/:token/results` | [`getResults`](Backend/src/controllers/testsController.js:241) | SELECT `participants`, `test_attempts`, `answers` JOIN `questions` | agregasi per kategori |

Detail perilaku penting:
- **[FAKTA]** Pemilihan soal `start`/`submit` memakai `WHERE track = $1 AND type = $2 AND active = TRUE ORDER BY id ASC LIMIT 10` — [`testsController.js:81`](Backend/src/controllers/testsController.js:81) dan [`testsController.js:151`](Backend/src/controllers/testsController.js:151). Tidak ada konsep set.
- **[FAKTA]** Post-test dibatasi satu kali: `start` menolak (409) bila ada attempt `score IS NOT NULL`, dan melanjutkan attempt pending (`score IS NULL`) — [`testsController.js:57`](Backend/src/controllers/testsController.js:57).
- **[FAKTA]** `submit` memakai `withTransaction` dengan `pool.connect()` + satu client — [`db.js:21`](Backend/src/config/db.js:21). Ini sudah sesuai rekomendasi KONTEKS (transaksi aman).
- **[FAKTA]** `tokenLimiter` terpasang di `GET /participants/:token`, `GET/PATCH /progress/:token`, dan seluruh route `/tests` — [`participants.js:14`](Backend/src/routes/participants.js:14), [`progress.js:13`](Backend/src/routes/progress.js:13), [`tests.js:18`](Backend/src/routes/tests.js:18).
- **[FAKTA]** `POST /api/participants` tidak memakai `tokenLimiter` (hanya `globalLimiter`).

---

## 4. Matriks gap: kebutuhan frontend/PRD vs dukungan backend

Sumber kebutuhan: PRD FR-05, FR-09, FR-10, FR-11, FR-12, FR-14; `setSoal.js` (`SET_SOAL`, `TIPE_META`, `STATUS_META`, `MAKS_SOAL`, `DAFTAR_KODE_KELAS`); `kodeKelas.js` (`daftarKelompok`, `hasilKelompok`, `STATUS_KODE`, `STATUS_PESERTA`).

| # | Kebutuhan (PRD/frontend) | Dukungan backend saat ini | Kekurangan terverifikasi |
|---|---|---|---|
| G1 | Entitas **set soal** (id, nama, catatan, jalur, tipe, kodeKelas, rilis, tutup, status) — `setSoal.js:39` | Tidak ada tabel set | Perlu tabel `question_sets` baru |
| G2 | **Soal milik set** (relasi soal→set) | `questions` hanya punya `track`+`type` | Perlu kolom `set_id` (FK) di `questions` |
| G3 | **Tipe tes** pre/post/**retensi** — `TIPE_META` | `test_attempts.type` CHECK hanya `pretest`/`posttest`; `questions.type` tanpa CHECK | Perlu longgarkan CHECK `test_attempts.type` atau tambah nilai `retensi` |
| G4 | **Status** draf/terjadwal/aktif — `STATUS_META` | Tidak ada kolom status set | Perlu kolom `status` di `question_sets` |
| G5 | **Tanggal rilis/tutup** — `setSoal.js:47` | Tidak ada kolom jadwal | Perlu `rilis_at`/`tutup_at` di `question_sets` |
| G6 | **Kode kelas terkait set** — `setSoal.js:46`, `kodeKelas.js:162` | `class_codes` ada, tapi tanpa relasi ke set | Perlu relasi set↔kode kelas |
| G7 | **Attempt terkait set** | `test_attempts` tanpa `set_id` | Perlu kolom `set_id` (FK) di `test_attempts` |
| G8 | **Login admin** (FR-09) | Tidak ada tabel/endpoint admin | Perlu tabel `admin_users` + auth (BE-03) |
| G9 | **CRUD set & pertanyaan** (FR-10) | Tidak ada endpoint admin | Perlu API admin (BE-04) |
| G10 | **CRUD kode kelas** (FR-11) | Hanya `validate` | Perlu API admin kode kelas (BE-05) |
| G11 | **Dashboard statistik** (FR-12) | Tidak ada endpoint agregasi | Perlu endpoint statistik (BE-08) |
| G12 | **Tes ulang 14 hari** (FR-14) | Tidak ada konsep retensi/jadwal | Perlu tipe `retensi` + aturan jadwal (BE-06) |
| G13 | **Maks 10 soal/set** — `MAKS_SOAL` (`setSoal.js:5`) | `LIMIT 10` di query, tanpa constraint DB | Perlu validasi server + opsional constraint |
| G14 | **Kunci jawaban tidak dikirim ke peserta** | `start` tidak mengirim `kunci` — [`testsController.js:114`](Backend/src/controllers/testsController.js:114) | Sudah sesuai; pertahankan saat menambah set |
| G15 | **Kode kelas format `PR-XXXX`** — `setSoal.js:30` | `class_codes.code` TEXT bebas | Perlu keputusan format/validasi (BE-05) |

Catatan: **[FAKTA]** UI admin frontend saat ini memakai data/state lokal (`setSoal.js`, `kodeKelas.js`) dan belum memanggil API backend; integrasi frontend di luar cakupan task backend.

---

## 5. Rekomendasi urutan migrasi (additive, belum diimplementasikan)

**[REKOMENDASI]** Semua migrasi baru bersifat additive dan tidak mengubah `001`/`002`. Nama file mengikuti pola `00N_*.sql` agar urut secara leksikografis (runner memakai `.sort()` — [`migrate.js:12`](Backend/src/db/migrate.js:12)).

1. **`003_migration_tracking.sql`** — tabel pelacak migrasi.
   - Tabel `schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`.
   - Tujuan: mencegah eksekusi ulang file yang sudah diterapkan (lihat bagian 7).
   - Kompatibilitas: additive; tidak menyentuh data lama.

2. **`004_question_sets.sql`** — entitas set soal.
   - Tabel `question_sets`: `id TEXT PRIMARY KEY`, `nama TEXT NOT NULL`, `catatan TEXT`, `jalur TEXT NOT NULL` (nilai `anak`/`dewasa`/`lansia`), `tipe TEXT NOT NULL` (`pre`/`post`/`retensi`), `status TEXT NOT NULL DEFAULT 'draf'` (`draf`/`terjadwal`/`aktif`), `rilis_at DATE`, `tutup_at DATE`, `created_at`, `updated_at`.
   - Constraint: CHECK `status`, CHECK `tipe`, CHECK `tutup_at IS NULL OR rilis_at IS NULL OR tutup_at >= rilis_at`.
   - Tujuan: menampung field `SET_SOAL` (`setSoal.js:39`).

3. **`005_questions_set_link.sql`** — relasi soal→set.
   - `ALTER TABLE questions ADD COLUMN set_id TEXT REFERENCES question_sets(id) ON DELETE SET NULL` (nullable untuk kompatibilitas data lama).
   - Index `idx_questions_set` pada `(set_id)`.
   - Tujuan: soal menjadi milik set (G2).

4. **`006_attempts_set_link.sql`** — relasi attempt→set.
   - `ALTER TABLE test_attempts ADD COLUMN set_id TEXT REFERENCES question_sets(id) ON DELETE SET NULL` (nullable).
   - Longgarkan CHECK `type` agar mendukung `retensi` (mis. drop + recreate CHECK dengan nilai `pretest`/`posttest`/`retensi`).
   - Index `idx_test_attempts_set` pada `(set_id)`.
   - Tujuan: attempt terkait set + dukungan tipe retensi (G3, G7, G12).

5. **`007_class_code_set_link.sql`** — relasi set↔kode kelas.
   - Opsi A: kolom `set_id` di `class_codes` (satu kode → satu set).
   - Opsi B: tabel pivot `set_class_codes (set_id, code)` (satu set → banyak kode).
   - **[ASUMSI]** `setSoal.js` menunjukkan satu set punya satu `kodeKelas`, tetapi `kodeKelas.js:162` mengelompokkan banyak set per kode. Keputusan relasi perlu dikonfirmasi (bagian 8).
   - Tujuan: keterkaitan set-kelas (G6).

6. **`008_admin_users.sql`** — akun admin (prasyarat BE-03).
   - Tabel `admin_users (id UUID PK, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, active BOOLEAN DEFAULT TRUE, created_at)`.
   - Tujuan: login admin (G8). Implementasi auth di BE-03.

7. **`009_questions_constraints.sql`** (opsional) — constraint tambahan.
   - CHECK `type` pada `questions` bila diperlukan; constraint jumlah soal per set tidak praktis di level DB (lebih baik validasi aplikasi).

**[REKOMENDASI]** Urutan di atas menjaga dependensi FK: `question_sets` (004) dibuat sebelum kolom FK di 005/006/007.

---

## 6. Risiko data lama dan strategi backfill

**[FAKTA]** Data lama yang berpotensi terpengaruh: baris `questions` (30 soal pretest dari seed), `test_attempts`, `answers`, `progress`, `participants`, `class_codes`.

- **[REKOMENDASI] `questions.set_id`** — biarkan NULL untuk data lama; jangan paksa NOT NULL. Backfill opsional: buat satu set default per `(track, type)` lalu isi `set_id` baris lama. **[ASUMSI]** pemetaan set default perlu keputusan admin.
- **[REKOMENDASI] `test_attempts.set_id`** — biarkan NULL untuk attempt lama; query `results`/`start` harus tetap menangani `set_id IS NULL` (fallback ke perilaku track/type lama) agar riwayat tidak rusak.
- **[REKOMENDASI] Tipe `retensi`** — melonggarkan CHECK tidak mengubah data lama; nilai lama tetap valid.
- **[REKOMENDASI] Relasi set↔kode kelas** — backfill hanya bila kode kelas lama (`GURU-01`, `TANGKIS2026`, `SEKOLAH01`, `KOMUNITAS` dari [`seed-class-codes.js:3`](Backend/src/db/seed-class-codes.js:3)) perlu dipetakan ke set; default NULL aman.
- **[REKOMENDASI]** Tidak ada operasi `DELETE`/`DROP COLUMN`/`TRUNCATE` pada data lama. Semua kolom baru nullable atau punya DEFAULT.
- **[FAKTA]** `answers.question_id` memakai `ON DELETE RESTRICT` — [`001_init.sql:62`](Backend/src/db/migrations/001_init.sql:62); penghapusan soal yang sudah dijawab akan gagal, sehingga arsip soal lebih aman daripada hapus.

---

## 7. Risiko runner migrasi dan rekomendasi perbaikan

**[FAKTA]** [`migrate.js`](Backend/src/db/migrate.js:9) membaca semua `*.sql`, mengurutkan, lalu `pool.query(sql)` untuk **setiap** file **setiap kali dijalankan**, tanpa tabel pelacak.

Risiko:
- **[FAKTA]** Migrasi saat ini idempoten (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DROP NOT NULL`), sehingga eksekusi ulang aman. Namun ini kebetulan, bukan jaminan.
- **[REKOMENDASI]** Migrasi additive berikutnya (mis. `ALTER TABLE ... ADD COLUMN`) **tidak** idempoten secara default → eksekusi ulang akan error (`column already exists`) dan menghentikan runner. Wajib pakai `ADD COLUMN IF NOT EXISTS` atau tabel pelacak.
- **[FAKTA]** Seluruh file dieksekusi dalam satu `pool.query` per file tanpa transaksi eksplisit per file; kegagalan di tengah file bisa meninggalkan skema setengah jadi.
- **[REKOMENDASI]** Tambahkan tabel `schema_migrations` (migrasi `003`) dan ubah runner agar: (a) memeriksa `schema_migrations` sebelum eksekusi, (b) mencatat nama file setelah sukses, (c) membungkus tiap file dalam transaksi. Perubahan runner ini adalah bagian BE-02, bukan BE-01.
- **[REKOMENDASI]** Pertahankan `IF NOT EXISTS` pada semua statement baru sebagai lapisan kedua.

---

## 8. Pertanyaan/keputusan yang perlu dikonfirmasi

1. **[ASUMSI]** Relasi set↔kode kelas: satu set punya satu kode (per `setSoal.js`) atau satu kode menampung banyak set (per `kodeKelas.js:162`)? Menentukan pilihan migrasi `007`.
2. **[ASUMSI]** Apakah tipe `retensi` (FR-14) masuk versi pertama atau fitur tambahan? Menentukan apakah CHECK `test_attempts.type` perlu dilonggarkan sekarang.
3. **[ASUMSI]** Format kode kelas: apakah wajib `PR-XXXX` (per `setSoal.js:30`) atau bebas seperti seed lama (`GURU-01`, dll.)? Menentukan validasi BE-05.
4. **[ASUMSI]** Apakah data lama (30 soal pretest, attempt, progress) perlu di-backfill ke set default, atau dibiarkan tanpa set?
5. **[ASUMSI]** Batas 10 soal/set (`MAKS_SOAL`) — apakah constraint bisnis wajib di server?
6. **[ASUMSI]** Apakah `POST /api/participants` perlu `tokenLimiter` tambahan (saat ini hanya `globalLimiter`)?
7. **[ASUMSI]** Apakah perlu tabel pelacak migrasi (`schema_migrations`) sebelum migrasi additive berikutnya? (Rekomendasi: ya.)

---

## 9. Perintah test yang dijalankan dan hasil

Perintah: `npm test` (dijalankan dari `Backend/`).
Hasil: **lulus 4/4** — `scoreAnswers menghitung jawaban benar`, `scoreAnswers menangani jawaban kosong`, `isPassed posttest lulus jika skor >= 8`, `evaluate mengembalikan passed sesuai tipe`. Durasi ~185 ms, exit code 0. Tes tidak memerlukan koneksi database.

Tidak dijalankan (sesuai batasan BE-01): `node src/db/migrate.js`, `seed-class-codes.js`, `seed-questions.js`, dan query tulis apa pun. `Backend/.env` tidak dibaca.

---

## 10. Batasan kepatuhan BE-01

- Tidak ada perubahan pada controller, route, service, SQL, seed, package, README, konfigurasi, atau file frontend.
- Satu-satunya file baru: `Backend/plans/BE-01-audit.md` (laporan ini).
- Tidak ada migrasi/seed/query tulis yang dijalankan; `Backend/.env` tidak dibuka.
