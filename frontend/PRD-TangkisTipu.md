# PRD: TangkisTipu

## 1. Overview

- **Nama project:** TangkisTipu. (Klarifikasi)
- **Ringkasan:** Website edukasi anti-penipuan online yang membantu pengguna mengenali modus penipuan lewat simulasi interaktif, mengarahkan pengguna ke kanal pelaporan resmi, dan menyediakan data skor pre-test dan post-test untuk mengukur dampak edukasi. (Sumber #3)
- **Platform:** Web responsif dengan pendekatan mobile-first, diakses lewat browser HP tanpa instal aplikasi. (Sumber #5)
- **Konteks:** Project dibuat untuk lomba. (Klarifikasi)
- **Timeline:** Tidak ada deadline yang ditetapkan. (Klarifikasi)

## 2. Problem Statement

- IASC telah menerima 637.055 laporan pengaduan sejak beroperasi pada 22 November 2024 sampai 31 Juli 2026.
- Selama Januari-Juli 2026, Satgas PASTI menerima 25.875 pengaduan entitas ilegal, dan sebagian besar (22.529) terkait pinjaman online ilegal.
- Modus yang sering muncul antara lain penipuan yang mengatasnamakan lembaga resmi, investasi ilegal, dan tugas berkomisi.
- Materi edukasi dari lembaga resmi umumnya berbentuk bacaan atau booklet.
- Kelompok rentan seperti lansia dan pelajar membutuhkan cara belajar yang lebih praktis, yaitu latihan mengenali penipuan dalam situasi yang mirip aslinya, dengan bahasa yang sesuai kelompoknya.

(Sumber #2)

## 3. Goals & Objectives

- **G1:** Meningkatkan kemampuan pengguna mengenali modus penipuan online lewat simulasi interaktif. (Sumber #3)
- **G2:** Mengarahkan pengguna ke kanal pelaporan resmi (OJK, IASC, Satgas PASTI, serta kanal pemerintah lain seperti Komdigi, LAPOR!, dan kepolisian) dengan petunjuk yang jelas. (Sumber #3, klarifikasi)
- **G3:** Menyediakan data hasil belajar (skor pre-test dan post-test) untuk mengukur dampak edukasi. (Sumber #3)

## 4. Target User

- **Anak & Remaja (10-17 tahun):** pelajar SMP-SMA dan anak-anak. Terbiasa memakai HP, rentan pinjol, tugas berkomisi, dan hadiah palsu. (Sumber #4, klarifikasi)
- **Dewasa (18-59 tahun), termasuk mahasiswa:** rentan penipuan yang mengatasnamakan lembaga resmi, investasi ilegal, dan tugas berkomisi. (Sumber #2, #4, klarifikasi)
- **Lansia (60 tahun ke atas):** kurang familier dengan teknologi, rentan tautan atau APK palsu dan penipuan yang mengatasnamakan lembaga resmi. (Sumber #4, klarifikasi)
- **Pengguna tidak langsung:** guru, ketua komunitas, atau pengurus RT/RW yang memakai website sebagai materi penyuluhan. Ketua komunitas berperan sebagai admin. (Sumber #4, klarifikasi)

## 5. Scope

### In Scope: Fitur Utama (versi pertama)

- Pemilihan jalur pengguna: Anak & Remaja, Dewasa, Lansia (Sumber #6, klarifikasi)
- Identitas peserta anonim: nama panggilan dan kode peserta (klarifikasi)
- Katalog modus penipuan (Sumber #6)
- Simulasi skenario interaktif (Sumber #6)
- Pre-test dan post-test (Sumber #6)
- Halaman Cara Melapor (Sumber #6)
- Ringkasan satu halaman per modus dalam PDF dan gambar (Sumber #6, klarifikasi)
- Fitur admin: login admin, pengelolaan set soal, kode kelas/komunitas, dan dashboard admin (Sumber #7, klarifikasi)

### Fitur Tambahan / Nice to Have

- Sertifikat atau badge sederhana (Sumber #7)
- Tes ulang setelah 2 minggu (klarifikasi)

### Out of Scope (Sumber #8)

- Menerima atau menampung laporan penipuan dari warga (hanya mengarahkan ke kanal resmi)
- Menyimpan data pribadi peserta (nama asli, nomor HP, email)
- Pemindai tautan atau deteksi penipuan otomatis
- Aplikasi mobile native
- Konsultasi hukum atau pendampingan korban

## 6. Functional Requirements

### Fitur Utama

**FR-01 Pemilihan jalur pengguna.** Pengguna memilih salah satu dari tiga jalur: Anak & Remaja (10-17 tahun), Dewasa (18-59 tahun, termasuk mahasiswa), atau Lansia (60 tahun ke atas). (Sumber #6, #9, klarifikasi)

**FR-02 Identitas peserta anonim.** Peserta mengisi nama panggilan bebas dan mendapat kode peserta acak yang dipakai untuk mengaitkan hasil pre-test, post-test, dan tes ulang. Sistem tidak meminta nama asli, nomor HP, atau email, dan tidak ada verifikasi. Setelah kode diterbitkan, tampil layar "simpan kodemu" dengan tombol salin atau unduh. Jika kode hilang, peserta membuat kode baru dan hasil lamanya tidak tersambung. (Sumber #6, #8, klarifikasi)

**FR-03 Katalog modus penipuan.** Mencakup 8 modus: pinjol ilegal, mengatasnamakan lembaga resmi, investasi ilegal, tugas berkomisi, tautan atau APK palsu, hadiah palsu, penipuan belanja online, dan love scam. Dasar pemilihannya adalah data IASC/Satgas PASTI dan booklet OJK. Setiap modus menampilkan cara kerja, ciri-ciri, tindakan yang benar, tanggal pembaruan, dan sumber. (Sumber #6, #2, #4, klarifikasi)

**FR-04 Simulasi skenario interaktif.** Menampilkan tampilan chat WhatsApp atau SMS palsu, pengguna memilih tindakan, lalu mendapat penjelasan langsung. Tersedia 8-10 skenario per jalur. (Sumber #6)

**FR-05 Pre-test dan post-test.** Tiap set berisi 10 soal pilihan ganda, dan soalnya berbeda untuk tiap jalur. Pre-test tidak wajib. Post-test hanya bisa dikerjakan sekali per set, dan admin dapat memasang set post-test baru secara berkala (mingguan atau beberapa kali sesuai pengaturan admin). Skor disimpan anonim. Kenaikan skor hanya dihitung dari peserta yang mengerjakan pre-test dan post-test. (Sumber #6, #8, klarifikasi)

**FR-06 Hasil tes.** Setelah post-test, peserta melihat hasilnya sendiri dan skenario yang masih salah. Peserta tidak bisa melihat skor peserta lain. (Sumber #9, klarifikasi)

**FR-07 Halaman Cara Melapor.** Hanya berisi tautan dan kontak resmi, ditambah peringatan bahwa situs ini bukan kanal pelaporan. Kanal yang ditampilkan: (Sumber #6, #8, klarifikasi)
- iasc.ojk.go.id untuk korban penipuan transaksi keuangan
- sipasti.ojk.go.id, Kontak OJK 157, dan WhatsApp 081 157 157 157 untuk pinjol atau investasi ilegal dan cek legalitas
- cekrekening.id (Komdigi) untuk cek dan lapor rekening penipu
- aduannomor.id (Komdigi) untuk blokir nomor HP penipu
- lapor.go.id dengan kategori Penipuan Online
- patrolisiber.id untuk kejahatan siber ke kepolisian
- Anjuran segera meminta bank memblokir rekening dalam 24 jam pertama

**FR-08 Ringkasan satu halaman per modus.** Dapat dicetak atau dibagikan dalam bentuk PDF dan gambar. (Sumber #6, klarifikasi)

**FR-09 Login admin.** Admin (ketua komunitas) login dengan email dan kata sandi. Akun admin dibuat oleh pemilik project untuk tiap ketua komunitas, bukan lewat pendaftaran mandiri. Larangan menyimpan data pribadi hanya berlaku untuk peserta; email admin disimpan seperlunya untuk login. (Sumber #7, #8, klarifikasi)

**FR-10 Pengelolaan set soal oleh admin.** Admin mengelola set pre-test dan post-test serta mengatur tanggal rilisnya. (Sumber #7, klarifikasi)

**FR-11 Kode kelas/komunitas.** Kode dibuat oleh admin agar hasil per kelompok terlihat terpisah, dan hasil kelompok hanya terlihat oleh admin. Peserta dapat memasukkan kode kelas secara opsional. (Sumber #7, #9, klarifikasi)

**FR-12 Dashboard admin.** Menampilkan jumlah peserta, rata-rata skor pre vs post, dan skenario yang paling sering salah dijawab. Hasil kelompok hanya bisa dilihat admin. (Sumber #7, klarifikasi)

### Fitur Tambahan (bukan wajib di versi pertama)

**FR-13 Badge dan sertifikat.** Diberikan jika skor post-test minimal 8 dari 10. Sertifikat memuat nama panggilan dan kode unik. (Sumber #7, klarifikasi)

**FR-14 Tes ulang setelah 2 minggu.** Memakai set soal baru dari admin yang terbuka minimal 14 hari setelah post-test. Peserta kembali sendiri dengan kode yang sama, tanpa pengingat otomatis; ketua komunitas dapat mengingatkan kelompoknya. (Klarifikasi)

## 7. Non-Functional Requirements

- **NFR-01** Responsif dan mobile-first; dapat diakses lewat browser tanpa instal aplikasi. (Sumber #5)
- **NFR-02** Tidak menyimpan data pribadi peserta (nama asli, nomor HP, email); skor disimpan anonim. (Sumber #6, #8, klarifikasi)
- **NFR-03** Bahasa konten disesuaikan dengan kelompok pengguna. (Sumber #2)
- **NFR-04** Aksesibilitas untuk lansia: ukuran huruf besar dan kontras jelas. (Klarifikasi)
- **NFR-05** Konten merujuk ke sumber resmi OJK/Satgas PASTI; setiap modus mencantumkan tanggal pembaruan dan sumber. (Sumber #6, #10)
- **NFR-06** Tidak ada integrasi API pihak ketiga. (Sumber #10)
- **NFR-07** Teknologi: React untuk frontend, Supabase untuk database dan login admin, dan Vercel untuk hosting. (Sumber #10, klarifikasi)
- **NFR-08** Performa: halaman termuat di bawah 3 detik pada jaringan 4G. (Klarifikasi)
- **NFR-09** Dukungan browser: Chrome, Safari, Firefox, dan Edge versi terbaru, termasuk Chrome Android. (Klarifikasi)
- **NFR-10** Keamanan: situs memakai HTTPS, kode peserta acak yang tidak bisa ditebak, dan data hasil tes hanya bisa dibuka admin. (Klarifikasi)

## 8. User Flow

**Peserta**
1. Membuka website, memilih jalur, lalu mengisi nama panggilan dan menerima kode peserta (disimpan lewat tombol salin atau unduh).
2. (Opsional) Mengerjakan pre-test.
3. Mempelajari katalog modus dan mencoba simulasi skenario.
4. Mengerjakan post-test (sekali per set), lalu melihat hasil dan skenario yang masih salah.
5. Membuka halaman Cara Melapor dan/atau mengunduh ringkasan (PDF atau gambar) untuk dibagikan.
6. (Opsional) Memasukkan kode kelas agar hasil tercatat di kelompoknya.
7. (Fitur tambahan) Kembali setelah minimal 14 hari dengan kode yang sama untuk tes ulang.

**Admin (ketua komunitas)**
1. Login dengan email dan kata sandi.
2. Membuat kode kelas dan memasang set soal baru beserta tanggal rilisnya.
3. Melihat dashboard dan hasil kelompok.

(Sumber #9, klarifikasi)

## 9. Success Metrics

- Masa uji coba 4 minggu.
- Jumlah peserta unik: 100.
- Rata-rata skor post-test naik minimal 2 poin dari skala 10 dibanding pre-test.
- Skor tes ulang setelah 2 minggu turun maksimal 1 poin dari skor post-test.
- Jumlah kelas atau komunitas yang memakai kode kelas: 3.

(Sumber #11, klarifikasi)

## Saran Tambahan (opsional)

Bagian ini bukan requirement resmi.

- Pastikan set soal pre-test dan post-test setara tingkat kesulitannya agar perbandingan skor adil.
- Cek ulang tautan dan status kanal pelaporan sebelum lomba, karena kanal pemerintah bisa berubah.
- Siapkan data uji coba (peserta contoh) untuk dashboard saat demo ke juri.
- Tetapkan masa simpan data hasil tes (misalnya dihapus otomatis setelah periode lomba) agar sejalan dengan prinsip minim data.

## 10. Pertanyaan Terbuka

1. Pertanyaan klarifikasi sebelumnya sudah terjawab dan masuk ke requirement di atas. Satu hal tersisa: Supabase dan Vercel adalah layanan pihak ketiga, sedangkan data project menyebut tidak ada integrasi API pihak ketiga (#10). Apakah keduanya dikecualikan dari batasan itu sebagai infrastruktur?
