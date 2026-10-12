# Audit Akhir Backend TangkisTipu

Tanggal pemeriksaan: 12 Oktober 2026  
Sumber: `ProjectTangkisTipu(2).zip`  
Cakupan: backend, migrasi, seed, API admin/peserta, statistik, kesiapan integrasi frontend.

## Ringkasan

- `npm test`: **128/128 tes lulus** saat dijalankan pada source dari ZIP.
- Test yang tersedia menggunakan mock/seam database; belum ada verifikasi end-to-end terhadap PostgreSQL nyata.
- **Status rekomendasi: belum siap untuk integrasi end-to-end/produksi sebelum temuan prioritas tinggi berikut diperbaiki.** Ini bukan karena automated test gagal, melainkan karena ada kasus bisnis dan relasi database yang tidak dicakup oleh test suite saat ini.

## Temuan

### P1 — `setId` eksplisit melewati pengecekan status dan jadwal

**Lokasi:** `Backend/src/controllers/testsController.js`, fungsi `ambilSetAktif()`.

Jika request peserta mengirim `setId`, kode hanya memeriksa keberadaan set, `jalur`, dan `tipe`, kemudian mengembalikan set tersebut. Cabang ini tidak memanggil `setTersediaUntukPeserta()` sehingga set `draf`, `terjadwal`, atau sudah lewat tanggal tutup dapat dimulai jika ID diketahui. Jalur tanpa `setId` melewati `pilihSet()` yang memiliki pemeriksaan ketersediaan.

**Perbaikan:** terapkan validasi status dan jadwal yang sama untuk kedua cabang; tambahkan test controller untuk `setId` yang draf, belum rilis, dan sudah tutup.

### P1 — Seed soal tidak menghubungkan pertanyaan ke set soal

**Lokasi:** `Backend/src/db/seed-questions.js`, `Backend/src/db/seed-question-sets.js`, `Backend/src/db/data/question-sets.json`.

`seed-questions.js` memasukkan soal tanpa kolom `set_id`. `seed-question-sets.js` membuat set dan relasi set↔kode kelas, tetapi tidak memasangkan 30 soal pretest ke set. README menjalankan migrasi sebelum seed; akibatnya, pada database baru, migrasi 009 berjalan ketika belum ada soal lama untuk di-backfill, lalu soal seed masuk tanpa `set_id`. Endpoint tes memilih soal dengan `WHERE set_id = $1`, sehingga set seed dapat berakhir tanpa soal dan `start` mengembalikan `QUESTIONS_NOT_AVAILABLE`.

**Perbaikan:** tentukan pemetaan bisnis yang eksplisit dari soal (track/type) ke set yang benar; jangan membuat pemetaan nama set secara spekulatif. Tambahkan verifikasi seed yang memeriksa setiap set yang memang boleh dipakai peserta memiliki jumlah soal sesuai kebutuhan (maksimal 10 dan biasanya tepat 10 bila itu aturan produk).

### P1 — Migrasi 009 disebut opsional, tetapi otomatis dijalankan oleh runner

**Lokasi:** `Backend/src/db/migrate.js` dan `Backend/src/db/migrations/009_backfill_legacy_sets.sql`.

Runner menerapkan setiap file `.sql` yang belum terdaftar. Karena migrasi 009 berada dalam folder tersebut, migrasi akan dijalankan otomatis pada `node src/db/migrate.js`, bukan bersifat opt-in. Jika migrasi dijalankan pada database berisi soal/attempt lama, ia akan menautkan baris `set_id IS NULL` ke set default dan mencatat migrasi. Pada database baru, ia dapat selesai tanpa baris untuk di-backfill tetapi tetap tercatat; soal yang baru dimasukkan lewat seed setelahnya tidak akan di-backfill oleh runner karena 009 sudah ditandai selesai.

**Tindakan sebelum migrasi berikutnya:** putuskan apakah backfill memang dikehendaki. Jika opsional, keluarkan dari urutan migrasi otomatis dan jadikan skrip/command eksplisit, atau implementasikan mekanisme opt-in yang jelas. Jangan jalankan migrasi pada database berisi data penting sebelum keputusan ini dibuat dan backup tersedia.

### P1 — Field `kodeKelas` pada CRUD set diterima tetapi tidak dipersistenkan

**Lokasi:** `Backend/src/controllers/questionSetsController.js`, `createSet()`, `updateSet()`, `listSets()`, `getSet()`.

Payload skema mengizinkan `kodeKelas`, tetapi INSERT/UPDATE ke `question_sets` tidak menyimpan relasi ke `set_class_codes`. Respons `createSet()` dapat menggemakan nilai request seolah-olah tersimpan, sedangkan `listSets()`/`getSet()` tidak membaca relasi pivot dan cenderung mengembalikan `kodeKelas` kosong. Relasi yang dibuat melalui endpoint kode kelas memang bisa tersimpan, tetapi kontrak CRUD set belum konsisten.

**Perbaikan:** tentukan kontrak kanonis (misalnya `kodeKelas` tunggal atau `kodeKelasIds`/array), sinkronkan pivot dalam transaksi saat create/update, dan baca pivot saat list/detail. Pastikan perubahan satu endpoint tercermin pada endpoint satunya.

### P2 — Statistik persentase salah menghitung jawaban kosong sebagai salah

**Lokasi:** `Backend/src/controllers/adminStatsController.js`, query di `getSoalSalah()` dan `getKategoriSalah()`.

Submit tes menyimpan baris `answers` untuk soal kosong dengan `selected_option = NULL` dan `is_correct = FALSE`. Statistik menghitung `salah` dengan `COUNT(*) FILTER (WHERE a.is_correct = FALSE)`, yang memasukkan jawaban kosong; sementara `dijawab` hanya menghitung `selected_option IS NOT NULL`. Akibatnya `persenSalah = salah / dijawab` dapat terlalu besar, bahkan lebih dari 100%, bertentangan dengan definisi di kode/dokumentasi bahwa jawaban kosong tidak dihitung.

**Perbaikan:** gunakan kondisi `a.selected_option IS NOT NULL AND a.is_correct = FALSE` untuk penghitung salah dan HAVING pada kedua query; tambahkan test yang mencampur jawaban salah, benar, dan kosong.

### P2 — Semantik tanggal penutupan dan status `terjadwal` perlu diselaraskan

**Lokasi:** `Backend/src/services/setSelectionService.js` dan `Backend/src/controllers/questionSetsController.js`.

- `statusJadwal()` membandingkan timestamp saat ini terhadap nilai tanggal tutup. Jika `tutup_at` adalah kolom DATE pada hari yang sama, nilainya merepresentasikan awal hari; set dapat dianggap tutup sejak tengah malam pada tanggal tutup, bukan setelah hari itu berakhir.
- `publishSet()` menetapkan status `terjadwal` bila `rilis` diisi, sedangkan `setTersediaUntukPeserta()` hanya mengizinkan `status === 'aktif'`. Tidak ada proses otomatis yang mengubah `terjadwal` menjadi `aktif`; artinya set terjadwal tetap tak dapat digunakan setelah tanggal rilis kecuali statusnya diaktifkan secara manual.

**Perbaikan:** konfirmasi aturan produk. Jika tanggal tutup inklusif dan jadwal harus mengaktifkan set otomatis, bandingkan tanggal kalender secara konsisten pada zona waktu yang ditentukan dan definisikan transisi `terjadwal` menjadi tersedia tanpa mengandalkan perubahan manual.

### P2 — Batas 10 soal dan satu kali post-test belum aman terhadap request bersamaan

**Lokasi:** `Backend/src/controllers/questionSetsController.js` (`createQuestion`) dan `Backend/src/controllers/testsController.js` (`startTest`).

Pengecekan jumlah soal dan pengecekan attempt post-test dilakukan sebelum insert tanpa mekanisme lock/constraint unik yang mengamankan dua request bersamaan. Dua request paralel dapat sama-sama melewati pengecekan dan berpotensi membuat lebih dari 10 soal per set atau lebih dari satu attempt post-test yang akhirnya tersubmit.

**Perbaikan:** bila penggunaan paralel merupakan risiko yang perlu ditangani, lakukan serialisasi pada set/participant dalam transaksi dan/atau tambahkan constraint/strategi idempotensi yang sesuai; tambahkan integration test dengan PostgreSQL untuk race condition. Jangan mengandalkan unit test murni untuk membuktikan perilaku konkurensi.

### P2 — Frontend yang disertakan belum memanggil API backend

**Lokasi:** `frontend/src/**` pada ZIP ini.

Pencarian kode tidak menemukan pemanggilan `fetch`, Axios, `VITE_API_URL`, atau path `/api/...` di `frontend/src`. Jadi endpoint backend yang sudah dibuat belum dipakai oleh frontend; keberhasilan endpoint dan unit test belum menjamin alur UI end-to-end. Ini perlu ditangani oleh task integrasi frontend terpisah, sesuai batasan bahwa task backend tidak boleh mengubah frontend.

## Verifikasi yang dilakukan

- `npm test` pada source dari ZIP: **128 pass, 0 fail**.
- Test tersebut tidak menjalankan query terhadap PostgreSQL nyata; `Backend/README.md` juga mencatat batasan ini.
- Tidak menjalankan migrasi, seed, atau query tulis pada database.
- Tidak membaca atau menyalin nilai dari `Backend/.env`.

## Catatan kebersihan repository dan keamanan arsip

1. ZIP menyertakan file lokal `Backend/.env` walaupun file tersebut diabaikan Git. Jangan ikutkan file itu saat berbagi arsip. Jika berisi kredensial yang masih berlaku, rotasi password database dan `ADMIN_JWT_SECRET` sebagai tindakan pencegahan.
2. Banyak file backend tampak `modified` di working tree ZIP terutama karena perbedaan akhir baris CRLF/LF; diff yang mengabaikan whitespace akhir baris mempersempit perubahan backend substantif terutama ke `Backend/TASK.md`. Hindari `git add .` atau staging seluruh `Backend/` sebelum memastikan tidak memasukkan perubahan yang tidak dimaksud.
3. Belum ada test end-to-end terhadap PostgreSQL nyata. Sebelum produksi, tambahkan smoke/integration test untuk urutan migrasi + seed, CRUD set↔kode kelas, start/submit tes, serta agregasi statistik.

## Urutan perbaikan yang direkomendasikan

1. **BE-11:** tegakkan status/jadwal pada `startTest`, termasuk saat `setId` dikirim, dan tetapkan semantik tanggal.
2. **BE-12:** putuskan apakah migrasi 009 opt-in; selaraskan urutan migrasi dan seed agar soal terhubung ke set yang benar.
3. **BE-13:** persistensikan dan baca relasi `kodeKelas` ↔ set secara konsisten pada CRUD kedua entitas.
4. **BE-14:** perbaiki statistik jawaban salah agar mengabaikan jawaban kosong.
5. **BE-15:** tambahkan integration test PostgreSQL dan smoke test end-to-end backend; integrasi UI tetap menjadi task frontend terpisah.
