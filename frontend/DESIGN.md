# DESIGN.md — The Social Media Manager Insider

> Spesifikasi desain landing page kursus **"The Social Media Manager Insider"** (brand: **Volume One Studios**), disusun dari satu gambar referensi (`UIWEBLOMBA.jpg`).
>
> **Cara membaca angka:** semua warna (hex), ukuran (px), dan jarak adalah **estimasi visual** dari gambar statis (±736 px lebar) yang diskalakan ke kanvas desktop ±1280 px, lalu dibulatkan ke skala token supaya langsung bisa diimplementasikan. Hal yang **tidak terlihat di referensi** diberi label **[Saran]**.

**Versi 1.0 · 7 Oktober 2026**

---

## Daftar Isi

1. Ringkasan Cepat (TL;DR)
2. Konsep & Prinsip Desain
3. Struktur Halaman
4. Design Tokens (warna, tipografi, spacing, grid, radius, shadow, motion)
5. Elemen Dekoratif & Ilustrasi
6. Komponen
7. Spesifikasi per Section
8. Copywriting (teks persis dari referensi)
9. Panduan Gambar & Fotografi
10. Ikon
11. Interaksi & Motion
12. Responsif
13. Aksesibilitas
14. Implementasi (CSS variables, Tailwind, HTML skeleton)
15. Checklist Aset
16. Do & Don't
17. Asumsi, Batasan & Catatan

---

## 1. Ringkasan Cepat (TL;DR)

| Hal | Nilai |
|---|---|
| Gaya | Soft, friendly, airy — gaya "edu-SaaS" dengan sentuhan playful |
| Font | **Plus Jakarta Sans** (800 untuk heading, 400–600 untuk body) |
| Warna aksi / primary | Sky blue `#4DB6F3` |
| Warna teks | Navy `#0F1B3D` (heading) · `#2F3D5E` (body) · `#5B6B84` (sekunder) |
| Warna aksen | Amber `#F9AE41` (confetti, bintang, squiggle, smiley) |
| Background | Putih `#FFFFFF` + band biru pucat `#EAF5FD` |
| Bentuk | Tombol *pill*, kartu radius 16–28 px, avatar lingkaran |
| Shadow | Lembut bertint biru, mis. `0 10px 30px rgba(32,92,160,.12)` |
| Container | Maks. 1200 px, padding-x 40 px (lebar konten 1120 px) |
| Urutan section | Navbar → Hero → Trust strip → What You'll Learn → Instructor → Pricing |
| CTA | Satu label konsisten **"Enroll Now – $297"** (3×: navbar, hero, pricing) |

**Peta halaman (desktop):**

```text
+--------------------------------------------------------------+
| NAVBAR   [logo]   Home  Course  ...  FAQ        (CTA pill)   |
+--------------------------------------------------------------+
| HERO (putih + blob biru pucat)                               |
|   eyebrow                              .--------------.      |
|   H1 (3 baris) + smiley                |  blob + foto |      |
|   sub-headline                         |  + 3 kartu   |      |
|   (CTA)  (>) Watch Promo               |  melayang    |      |
|   (avatars) ***** social proof         '--------------'      |
+--------------------------------------------------------------+
| TRUST STRIP (band biru pucat)         logo x5                |
+--------------------------------------------------------------+
| WHAT YOU'LL LEARN (putih)                                    |
|   eyebrow / H2 / squiggle                                    |
|   [card][card][card][card][card][card]                       |
+--------------------------------------------------------------+
| INSTRUCTOR (banner biru, radius 28 px)                       |
|   [foto]   Hi, I'm Sara!  bio  [btn]      4 kredensial       |
+--------------------------------------------------------------+
| PRICING (band biru pucat)                                    |
|   Join Today / H2 / checklist  [note]  [ KARTU HARGA ]       |
+--------------------------------------------------------------+
```

**Jika dokumen ini dipakai sebagai prompt untuk AI coding agent**, tempelkan instruksi berikut di atasnya:

```text
Implementasikan landing page sesuai DESIGN.md ini. Ikuti token di §4, komponen di §6,
urutan & layout section di §7, dan gunakan teks persis dari §8. Untuk tombol dan teks
biru, pakai varian aman-kontras di §13. Buat responsif (mobile-first), semantik, dan
hormati prefers-reduced-motion. Jangan menambah warna, font, atau section di luar dokumen.
```

---

## 2. Konsep & Prinsip Desain

### 2.1 Profil halaman

| Aspek | Keterangan |
|---|---|
| Jenis | Landing page penjualan satu produk (kursus online), satu halaman |
| Tujuan utama | Konversi: klik **Enroll Now – $297** |
| Audiens | Pemula yang ingin menjadi freelance *social media manager*, ingin keluar dari kerja 9-to-5, mengejar "freedom lifestyle" |
| Brand | Volume One Studios |
| Wajah brand | Sara — instruktur & pemilik agensi 6-figure |
| Mood | Ramah · optimis · ringan · inspiratif · kredibel |
| Kata kunci visual | airy · rounded · sky-blue · soft shadow · confetti · foto manusia yang hangat |
| Tone of voice | Percakapan, orang pertama ("I went from…"), motivasional, langsung ("Invest in your freedom") |

### 2.2 Prinsip desain

1. **Friendly & approachable** — serba membulat (pill, kartu, avatar), ada smiley, foto tersenyum menatap kamera.
2. **Light & airy** — dominan putih dan biru pucat, whitespace lega, shadow lembut. Tidak ada blok warna gelap; satu-satunya warna pekat adalah teks navy.
3. **Satu aksi utama** — satu warna dan satu label CTA diulang di tiga titik; tidak ada CTA pesaing.
4. **Bukti sosial sejak layar pertama** — avatar + rating + testimoni + angka penghasilan di hero, logo strip tepat di bawahnya.
5. **Playful tapi terkontrol** — confetti (setengah lingkaran amber & kerikil biru) hanya bumbu: sedikit, kecil, tidak pernah menutupi teks.
6. **Mudah dipindai** — hierarki konsisten *eyebrow → heading → deskripsi singkat*; 6 kartu seragam (ikon + judul 2 baris + deskripsi 2–3 baris).
7. **Manusia di atas ilustrasi** — kepercayaan dibangun lewat foto orang nyata (hero, instruktur, avatar), bukan ilustrasi stok.

---

## 3. Struktur Halaman

| # | Section | Background | Isi inti | Tujuan |
|---|---|---|---|---|
| 1 | Navbar (sticky) | Putih | Logo · 6 link · CTA | Navigasi + CTA selalu terlihat |
| 2 | Hero | Putih + blob `sky-200` | Eyebrow, H1, sub, 2 CTA, social proof, foto, 3 kartu melayang | Value proposition + bukti sosial |
| 3 | Trust strip | Band `sky-100` penuh lebar | Teks kecil + 5 logo | Kredibilitas cepat |
| 4 | What You'll Learn | Putih + confetti | Eyebrow, H2, 6 kartu fitur | Menjelaskan isi & hasil kursus |
| 5 | Instructor | Putih; banner biru rounded di dalam container | Foto Sara, bio, tombol, 4 kredensial | Kepercayaan personal |
| 6 | Pricing / CTA | Band `sky-100` penuh lebar | Copy, checklist, note card, kartu harga, garansi | Konversi |
| 7 | **[Saran]** Testimonials · FAQ · Footer | — | Lihat §7.6 | Menutup halaman & melengkapi link navbar |

**Ritme background:** putih (hero) → biru pucat (trust) → putih (learn) → putih + banner biru (instructor) → biru pucat (pricing). Section berwarna selalu diselingi section putih.

### Pemetaan link navbar

| Link | Target | Catatan |
|---|---|---|
| Home | `#top` | Hero |
| Course | `#enroll` | Asumsi: "Course" = penawaran/harga (tidak ada section overview terpisah) |
| What's Inside | `#whats-inside` | Section 4 |
| About | `#about` | Section 5 (instruktur) |
| Testimonials | `#testimonials` | **Tidak ada di referensi** → buat section [Saran] atau hapus link |
| FAQ | `#faq` | **Tidak ada di referensi** → buat section [Saran] atau hapus link |

---

## 4. Design Tokens

### 4.1 Warna

**Brand — Sky blue**

| Token | Hex | Dipakai untuk |
|---|---|---|
| `--sky-50` | `#F5FAFE` | Tint sangat halus, hover tombol putih |
| `--sky-100` | `#EAF5FD` | Band section (trust, pricing), pill cicilan, chip ikon |
| `--sky-200` | `#D6ECFB` | Blob hero |
| `--sky-300` | `#A9D8F7` | Kerikil dekoratif, border hover kartu |
| `--sky-500` | `#4DB6F3` | **Primary**: tombol, banner instruktur, garis chart, bullet check |
| `--sky-600` | `#2A9BE6` | Hover tombol, ikon fitur, link |
| `--sky-700` | `#1673C4` | Teks biru ukuran kecil & tombol/banner versi AA (lihat §13) |
| `--sky-800` | `#0F5FA8` | Hover tombol versi AA; teks biru di atas band `sky-100` |

**Ink — Navy & abu kebiruan**

| Token | Hex | Dipakai untuk |
|---|---|---|
| `--ink-900` | `#0F1B3D` | H1/H2/H3, harga, teks pada tombol putih |
| `--ink-700` | `#2F3D5E` | Body utama (sub-headline, checklist) |
| `--ink-500` | `#5B6B84` | Teks sekunder (deskripsi kartu, caption, label kecil) |
| `--ink-300` | `#B8C4D4` | Ikon & elemen nonaktif (bukan untuk teks yang harus terbaca) |
| `--ink-200` | `#DCE5EF` | Border input / outline |
| `--ink-100` | `#EEF3F8` | Border kartu halus, divider |

**Sun — Amber (aksen)**

| Token | Hex | Dipakai untuk |
|---|---|---|
| `--sun-300` | `#FCD08A` | Latar lingkaran ikon "$" |
| `--sun-500` | `#F9AE41` | Confetti, squiggle, bintang rating, smiley |
| `--sun-600` | `#EE9418` | Simbol "$", variasi bintang lebih pekat |

**Netral & permukaan**

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--white` | `#FFFFFF` | Kartu, section, teks di atas banner biru |
| `--surface-glass` | `rgba(255,255,255,.92)` | Kartu melayang di hero |
| `--on-banner-muted` | `rgba(255,255,255,.85)` | Paragraf bio di banner |
| `--divider-on-blue` | `rgba(255,255,255,.25)` | Garis pemisah baris kredensial |

**Gradien (sangat halus)**

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--grad-banner` | `linear-gradient(135deg,#56BBF5 0%,#44AEF0 100%)` | Banner instruktur |
| `--grad-band` | `linear-gradient(180deg,#EAF5FD 0%,#F4FAFE 100%)` | Band pricing |
| `--grad-chart` | `linear-gradient(180deg,rgba(77,182,243,.30) 0%,rgba(77,182,243,0) 100%)` | Area di bawah garis chart |

**Proporsi (±60 / 30 / 10):** 60% putih & biru pucat · 30% navy (teks) + sky blue (aksi/banner) · 10% amber (aksen). Amber **tidak** dipakai untuk tombol atau teks.

### 4.2 Tipografi

- **Font utama:** Plus Jakarta Sans (Google Fonts, `wght@400;500;600;700;800`, `display=swap`). Alternatif terdekat: Poppins, DM Sans, Outfit.
- **Fallback:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Logo "VOLUME ONE / STUDIOS" adalah aset SVG, bukan teks web.

| Token | Dipakai untuk | Desktop | Mobile | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|---|
| `display` | H1 hero | 64 px | 40 px | 800 | 1.08 | −0.02em |
| `h2-lg` | "Hi, I'm Sara!" | 36 px | 28 px | 800 | 1.15 | −0.01em |
| `h2` | Judul section | 32 px | 26 px | 800 | 1.2 | −0.01em |
| `price` | "$297" | 48 px | 44 px | 800 | 1.0 | −0.02em |
| `stat` | "$8,750" | 28 px | 26 px | 800 | 1.1 | −0.01em |
| `h3` | Judul kartu fitur, note card | 17 px | 16 px | 700 | 1.3 | 0 |
| `body-lg` | Sub-headline hero | 18 px | 16 px | 400 | 1.6 | 0 |
| `body` | Paragraf, checklist | 16 px | 15 px | 400–500 | 1.6 | 0 |
| `body-sm` | Deskripsi kartu, bio banner | 14 px | 14 px | 400 | 1.55 | 0 |
| `label` | Eyebrow | 16 px (hero) / 14 px (section) | 14 px | 600 | 1.3 | 0.01em |
| `btn-lg` | CTA hero & pricing | 18 px | 16 px | 700 | 1 | 0 |
| `btn-md` | CTA navbar, tombol putih | 15 px | 14 px | 600 | 1 | 0 |
| `nav` | Link navbar | 14 px | 18 px (drawer) | 500 (aktif 600) | 1 | 0 |
| `caption` | Teks kartu melayang, garansi | 12–13 px | 12 px | 500 | 1.4 | 0 |

**Aturan tipografi**

- Heading berwarna `ink-900`; body `ink-700`; deskripsi kecil `ink-500`.
- H1 pecah 3 baris di desktop: *The Social / Media Manager / Insider* (max-width ±480 px). Pakai `text-wrap: balance` pada heading.
- Sub-headline hero max-width ±440 px; paragraf lain maks. 60–70 karakter per baris.
- Heading & judul kartu = *Title Case*; microcopy & deskripsi = *Sentence case*. Eyebrow tidak di-uppercase.
- Angka harga/statistik: `font-variant-numeric: tabular-nums`.
- Pemisah di label CTA memakai *en dash* dengan spasi: `Enroll Now – $297`.

### 4.3 Spacing

Basis **4 px**. Skala: `--space-1`=4 · `-2`=8 · `-3`=12 · `-4`=16 · `-5`=20 · `-6`=24 · `-8`=32 · `-10`=40 · `-12`=48 · `-16`=64 · `-20`=80 · `-24`=96 (px).

| Konteks | Nilai |
|---|---|
| Padding vertikal section | 80–96 px desktop · 56 px mobile |
| Eyebrow → heading | 16 px (hero) · 12 px (section) |
| Heading → deskripsi | 16–24 px |
| Heading section → grid kartu | 48 px |
| Gap grid kartu fitur | 20 px |
| Padding kartu fitur | 24 px 16 px |
| Padding kartu melayang | 14–16 px |
| Padding banner instruktur | 16 px (sisi foto) · 40 px (sisi konten) |
| Padding kartu harga | 32 px |
| Gap antar tombol (hero) | 20 px |
| Gap baris checklist | 14 px |

### 4.4 Grid & layout

| Item | Nilai |
|---|---|
| Container | `max-width: 1200px; margin-inline: auto` (konten 1120 px di desktop) |
| Padding-x container | 20 px (mobile) · 32 px (tablet) · 40 px (desktop) |
| Grid | 12 kolom, gap 24 px |
| Breakpoint | `sm 640` · `md 768` · `lg 1024` · `xl 1280` |
| Hero | 2 kolom ±52 / 48 (teks / visual) |
| Fitur | 6 kolom sama lebar (≥1024) → kartu ±170 px |
| Instruktur | 3 kolom: foto ±27% · teks ±36% · kredensial ±28% |
| Pricing | 2 kolom ±55 / 45 (copy / kartu harga) |
| Trust strip & Pricing | Background penuh lebar, konten tetap di container |

### 4.5 Radius

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--r-sm` | 8 px | Chip kecil, input |
| `--r-md` | 16 px | Kartu melayang A, foto kecil |
| `--r-lg` | 20 px | Kartu fitur, kartu melayang B/C, note card |
| `--r-xl` | 28 px | Banner instruktur, kartu harga |
| `--r-pill` | 999 px | Tombol, pill cicilan, badge |
| `--r-full` | 50% | Avatar, lingkaran ikon, blob |

### 4.6 Elevation (shadow)

Shadow selalu **bertint biru**, bukan hitam murni, agar tetap lembut.

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(15,27,61,.04)` | Elemen datar / subtle |
| `--shadow-sm` | `0 4px 14px rgba(32,92,160,.06)` | Kartu fitur (default), tombol putih |
| `--shadow-md` | `0 10px 30px rgba(32,92,160,.12)` | Kartu melayang, hover kartu fitur, note card |
| `--shadow-lg` | `0 24px 60px rgba(32,92,160,.16)` | Kartu harga |
| `--shadow-btn` | `0 8px 20px rgba(77,182,243,.38)` | Tombol primary |

### 4.7 Border & focus

| Item | Nilai |
|---|---|
| Border kartu fitur | `1px solid var(--ink-100)` |
| Kartu melayang | Tanpa border (hanya shadow) |
| Outline ikon di banner | `1.5px solid rgba(255,255,255,.6)` |
| Focus ring | `outline: 3px solid rgba(77,182,243,.45); outline-offset: 2px` |

### 4.8 Motion tokens

| Token | Nilai |
|---|---|
| `--dur-fast` | 150 ms |
| `--dur-base` | 250 ms |
| `--dur-slow` | 600 ms |
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` |
| `--float-dur` | 6 s (loop, `ease-in-out`) |

### 4.9 Layering (z-index)

| Layer | z-index |
|---|---|
| Blob & confetti | 0–1 |
| Foto hero | 2 |
| Kartu melayang | 3 |
| Teks hero | 4 |
| Navbar (sticky) | 50 |
| Drawer mobile | 60 |

---

## 5. Elemen Dekoratif & Ilustrasi

Dekorasi memberi kesan playful tanpa mengganggu keterbacaan. Semua dekorasi memakai `aria-hidden="true"` dan `pointer-events: none`, digambar sebagai **SVG inline** (ringan, warna dari token).

| Elemen | Bentuk | Warna | Ukuran | Dipakai di |
|---|---|---|---|---|
| Blob hero | Lingkaran besar, terpotong tepi kanan & dasar section | `sky-200` | 560–640 px | Belakang foto hero |
| Titik solid | Lingkaran penuh | `sky-500` | 28–36 px | Puncak blob hero |
| Setengah lingkaran | Half-disc, dirotasi bebas | `sun-500` | 20–32 px | Hero, Learn, Pricing |
| Kerikil | Elips / biji, dirotasi 20–60° | `sky-500` / `sky-300` | 14–28 px | Hero, Learn |
| Smiley | Lingkaran amber, mata tertutup & senyum navy; setengah lingkaran `sky-200` mengintip di belakang (hanya di H1) | `sun-500` + `ink-900` | 32–36 px | Akhir H1 "Insider"; di samping "Hi, I'm Sara!" |
| Squiggle | Swoosh pendek melengkung (seperti senyum tipis), ujung membulat, miring ±3° | `sun-500`, stroke 3 px | 56–96 px | Bawah H2 section |
| Panah melengkung | Garis lengkung + kepala panah | `sky-500`, stroke 3 px | ±56 × 30 px | Dari note card ke kartu harga |
| Hati | Ikon hati solid | `sky-500` | 14–20 px | Kartu benefit A, note card |

**Aturan penempatan confetti**

- Maks. **3–5 per layar**; ukuran bervariasi; jarak min. 24 px dari teks; tidak boleh menimpa CTA atau wajah model.
- Posisi & rotasi **ditetapkan tetap** (hard-coded), bukan acak saat render — mencegah layout shift dan hydration mismatch.
- Di mobile kurangi ±50% jumlahnya.

**Posisi kasar di referensi** (x%, y% dari section):

| Section | Elemen | Posisi |
|---|---|---|
| Hero | Setengah lingkaran amber | 44%, 9% (kanan atas kata "The") |
| Hero | Titik solid `sky-500` | 90%, 10% (puncak blob) |
| Hero | Kerikil `sky-500` | 54%, 29% (kiri kepala model) |
| Hero | Bentuk amber kecil | 92%, 60% (di bawah kartu stat) |
| Hero | Kerikil `sky-500` | 44%, 90% (dekat dasar section) |
| Learn | Setengah lingkaran amber · kerikil biru · kerikil biru · bentuk amber kecil | 10%,20% · 28%,27% · 80%,18% · 97%,76% |
| Pricing | Setengah lingkaran amber di sudut kanan atas note card; bentuk amber kecil di kiri atasnya; panah biru di bawah note card | Relatif terhadap note card |

**Snippet SVG**

```html
<!-- Setengah lingkaran (rotasi bebas, mis. transform: rotate(-25deg)) -->
<svg width="28" height="14" viewBox="0 0 28 14" aria-hidden="true">
  <path d="M0 14a14 14 0 0 1 28 0z" fill="#F9AE41"/>
</svg>

<!-- Kerikil -->
<svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
  <ellipse cx="12" cy="6" rx="12" ry="6" fill="#4DB6F3"/>
</svg>

<!-- Smiley -->
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
  <circle cx="18" cy="18" r="17" fill="#F9AE41"/>
  <path d="M10 15q3-4 6 0M20 15q3-4 6 0" stroke="#0F1B3D" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M11 21q7 7 14 0" stroke="#0F1B3D" stroke-width="2.2" stroke-linecap="round"/>
</svg>

<!-- Squiggle di bawah heading -->
<svg width="64" height="10" viewBox="0 0 64 10" fill="none" aria-hidden="true">
  <path d="M2 3C18 9 44 9 62 2" stroke="#F9AE41" stroke-width="3" stroke-linecap="round"/>
</svg>

<!-- Panah melengkung -->
<svg width="56" height="30" viewBox="0 0 56 30" fill="none" aria-hidden="true">
  <path d="M2 6C14 24 34 26 50 14" stroke="#4DB6F3" stroke-width="3" stroke-linecap="round"/>
  <path d="M41 15l9-1-3.5 8" stroke="#4DB6F3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```


---

## 6. Komponen

### 6.1 Logo

| Properti | Spec |
|---|---|
| Struktur | Ikon + wordmark dua baris |
| Ikon | 36–40 px; huruf "d" / angka "1" bergaya dalam cincin dua warna: amber `#F9AE41` (kiri-bawah) + sky `#4DB6F3` (kanan-atas) |
| Wordmark baris 1 | "VOLUME ONE" — 800, ±20 px, `ink-900`, uppercase, tracking 0.02em |
| Wordmark baris 2 | "STUDIOS" — 500, ±10 px, `ink-500`, uppercase, tracking 0.32em |
| Gap ikon–teks | 10 px |
| Tinggi total | 40 px (mobile 32 px) |
| Area aman | Min. 8 px di sekelilingnya |
| Perilaku | Klik → `#top` |

### 6.2 Navbar

| Properti | Spec |
|---|---|
| Tinggi | 80 px (mobile 64 px) |
| Posisi | `position: sticky; top: 0; z-index: 50` |
| Background | `#fff`; setelah scroll > 8 px: `rgba(255,255,255,.85)` + `backdrop-filter: blur(12px)` + border-bottom `ink-100` |
| Layout | `flex; align-items: center; justify-content: space-between` — logo (kiri) · link (tengah, gap 40 px) · CTA (kanan) |
| Link | 14 px / 500 / `ink-900`; **aktif** (Home) = weight 600 |
| Hover link | Warna `sky-600`; underline 2 px `sky-500` tumbuh (`scaleX` 0→1, 200 ms) |
| CTA | Button primary `md` — "Enroll Now – $297" |
| Mobile (<1024) | Link disembunyikan → tombol hamburger 44 × 44; drawer dari kanan (lebar 86%, backdrop `rgba(15,27,61,.4)`); link 18 px, gap 20 px; CTA full-width di dasar drawer |

### 6.3 Button

| Varian | Tinggi | Padding-x | Font | Dipakai di |
|---|---|---|---|---|
| `btn-primary` md | 44 px | 24 px | 15 / 600 | Navbar |
| `btn-primary` lg | 56 px | 36 px | 18 / 700 | Hero; kartu harga (block, lebar 100%) |
| `btn-white` | 44 px | 28 px | 15 / 600 | "Learn More About Sara" di atas banner biru |
| `btn-play` | ikon 40 px | — | 15 / 500 | "Watch Promo" |

Semua tombol: `border-radius: 999px`, `transition: all 200ms var(--ease-out)`, area klik min. 44 px.

| State | `btn-primary` | `btn-white` | `btn-play` |
|---|---|---|---|
| Default | bg `sky-500`, teks putih, `shadow-btn` | bg putih, teks `ink-900`, `shadow-sm` | Lingkaran border 2 px `sky-500`, segitiga `sky-500`, label `ink-900` |
| Hover | bg `sky-600`, naik 2 px, shadow `0 12px 26px rgba(42,155,230,.42)` | bg `sky-50`, naik 2 px | Lingkaran terisi `sky-500`, segitiga putih |
| Active | Kembali ke posisi awal, `scale(.98)` | Sama | `scale(.96)` |
| Focus-visible | Ring 3 px `rgba(77,182,243,.45)` + offset 2 px | Sama | Sama |
| Disabled | opacity .5, tanpa shadow, `cursor: not-allowed` | Sama | Sama |
| Loading | Spinner 18 px menggantikan label, lebar tetap, `aria-busy="true"` | — | — |

- Ikon play: segitiga solid 14 px, digeser 2 px ke kanan agar tampak terpusat secara optik.
- Teks putih di atas `sky-500` berkontras rendah (±2,3:1). Lihat varian aman di §13.

### 6.4 Eyebrow

| Properti | Spec |
|---|---|
| Font | 14 px (section) / 16 px (hero), weight 600, tanpa uppercase |
| Warna | `sky-600` (versi AA: `sky-700`); putih pada banner biru |
| Margin bawah | 12–16 px |
| Contoh | "The ultimate beginner-friendly course" · "What You'll Learn" · "Meet Your Instructor" · "Join Today" |

### 6.5 Heading section + squiggle

- H2 `h2`, `ink-900`; max-width 640 px; "What You'll Learn" dipecah 2 baris: *Everything you need to build / a successful SMM business*.
- Squiggle amber (§5) di bawah heading, margin-top 8 px: **center** 64 px di section Learn, **kiri** 96 px di section Pricing. Miring ±3°.

### 6.6 Social proof (hero)

| Bagian | Spec |
|---|---|
| Avatar group | 5 foto bulat 40 px, border 3 px putih, saling menimpa −12 px (urutan DOM = yang kanan di atas) |
| Rating | 5 bintang solid `sun-500`, 16 px, gap 2 px, di atas teks. Wajib `role="img" aria-label="Rated 5 out of 5"` |
| Teks | "Join 2,000+ students building their social media business" — 13–14 px / 400 / `ink-700`, max-width ±220 px (2 baris) |
| Layout | `flex; align-items: center; gap: 16px` — avatar group · (bintang di atas teks) |

### 6.7 Kartu melayang (hero)

Properti dasar:

| Properti | Spec |
|---|---|
| Background | `--surface-glass` |
| Radius | 16 px (A) · 20 px (B, C) |
| Shadow | `shadow-md` |
| Padding | 14–16 px |
| Posisi | `position: absolute` di kolom visual hero |
| Animasi | `float`: `translateY(0 → −8px → 0)`, 6 s, delay 0 / 1.2 / 2.4 s |

**A — Benefit chip** (lebar ±180 px)

- Ikon hati: kontainer bulat 28 px `sky-100`, hati solid `sky-500` 14 px.
- Teks "Build a business that gives you freedom" — 13 px / 500 / `ink-900`, 3 baris.
- Posisi: top ≈ 9%, right ≈ 13% dari kolom visual.

**B — Stat card** (lebar ±180 px)

- Label "Monthly Income" — 12 px / 500 / `ink-500`.
- Nilai "$8,750" — `stat` 28 px / 800 / `ink-900`.
- Delta "+28% this month" — 12 px / 600 / `sky-600`.
- Sparkline SVG 100 × 40: garis `sky-500` 2,5 px (round), area `--grad-chart`; naik dari kiri-bawah ke kanan-atas dengan beberapa lekukan; tanpa sumbu/label.
- Posisi: top ≈ 30%, right ≈ 2%.

```html
<svg viewBox="0 0 100 40" width="100" height="40" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4DB6F3" stop-opacity=".30"/>
      <stop offset="1" stop-color="#4DB6F3" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M2 34C12 30 16 22 26 25S42 33 52 22 70 10 80 14 94 6 98 3V40H2Z" fill="url(#spark)"/>
  <path d="M2 34C12 30 16 22 26 25S42 33 52 22 70 10 80 14 94 6 98 3"
        stroke="#4DB6F3" stroke-width="2.5" stroke-linecap="round"/>
</svg>
```

**C — Testimonial card** (lebar ±225 px)

- Avatar 32 px bulat di kiri atas; kutipan 13 px / 400 / `ink-900` / lh 1.45 (3 baris).
- Nama "– Jenna B." — 12 px / 600 / `ink-500`; 5 bintang 12 px `sun-500` di bawahnya.
- Posisi: top ≈ 65%, right ≈ 3%.

### 6.8 Logo strip

| Properti | Spec |
|---|---|
| Wrapper | Band penuh lebar `sky-100`; padding-y 28–32 px |
| Teks | "Trusted by aspiring social media managers worldwide" — 14 px / 500 / `ink-900` (opacity .8), center |
| Logo | Instagram · TikTok · Shopify · Pinterest · Canva — SVG monokrom `ink-900`, tinggi 24–30 px (disamakan secara optik), opacity .85 |
| Layout | `flex; justify-content: center; align-items: center; gap: 64px; flex-wrap: wrap` |
| Mobile | 3 + 2 baris, atau marquee pelan (berhenti saat hover; nonaktif bila reduced-motion) |

> Catatan hak merek dan klaim "Trusted by": lihat §17.

### 6.9 Kartu fitur ("What You'll Learn")

| Properti | Spec |
|---|---|
| Ukuran | ±170 × 230 px (desktop, 6 kolom) |
| Surface | Putih, border `1px ink-100`, radius 20 px, `shadow-sm` |
| Padding | 24 px 16 px |
| Layout | `flex-direction: column; align-items: center; text-align: center; gap: 12px` |
| Ikon | 44–48 px (lihat §10) |
| Judul | `h3` 17 px / 700 / `ink-900`, 2 baris (beri `min-height` 2 baris agar sejajar) |
| Deskripsi | `body-sm` 14 px / 400 / `ink-500`, 3 baris |
| Hover | Naik 4 px, `shadow-md`, border `sky-200`, 250 ms |
| Reveal | Fade-up saat masuk viewport, stagger 60 ms (opsional, lihat §11) |
| Isi | 6 kartu — lihat §8.4 |

### 6.10 Banner instruktur

| Properti | Spec |
|---|---|
| Container | Di dalam container 1200 px; radius 28 px; bg `--banner-bg` (= `--grad-banner`); min-height ±250 px; `overflow: hidden` |
| Grid | `grid-template-columns: minmax(240px,.8fr) minmax(0,1.15fr) minmax(220px,.8fr); gap: 40px; align-items: center` |
| Padding | 16 px (kiri & atas) · 40 px (kanan) · 0 (bawah, agar foto menempel ke dasar) |
| Foto | Radius 20 px di sudut atas, `object-fit: cover`, rasio ±4:3, menempel ke dasar banner |
| Eyebrow | "Meet Your Instructor" — 14 px / 600 / putih (opacity .9) |
| Heading | "Hi, I'm Sara!" — `h2-lg` putih + smiley 32 px |
| Bio | `body-sm` 14 px / lh 1.6 / `--on-banner-muted`, max-width 340 px |
| Tombol | `btn-white` "Learn More About Sara", margin-top 20 px |
| Kredensial | 4 `credential-item` (§6.11), gap 20 px, pemisah tipis `--divider-on-blue` (opsional) |

### 6.11 Credential item

| Properti | Spec |
|---|---|
| Ikon | Outline putih 24 px (stroke ±1,75 px) di dalam lingkaran 40 px berborder `1.5px rgba(255,255,255,.6)` |
| Teks | 15 px / 500 / putih |
| Layout | `flex; align-items: center; gap: 14px` |
| Isi | 6-Figure Agency Owner (medali) · Thousands of Students (grup orang) · Proven Systems & Strategies (diagram alur) · Real-World Experience (grafik) |

### 6.12 Checklist item

| Properti | Spec |
|---|---|
| Ikon | Lingkaran 20 px `sky-500`, centang putih (stroke 2,5 px) |
| Teks | 15–16 px / 500 / `ink-700` |
| Jarak | 12 px ikon–teks · 14 px antar baris |

### 6.13 Note card ("Your future self will thank you.")

| Properti | Spec |
|---|---|
| Surface | Putih, radius 20 px, padding 18 × 22 px, `shadow-md` |
| Transform | `rotate(-3deg)` |
| Teks | 18 px / 700 / `ink-900` / lh 1.3, max-width ±190 px, 2–3 baris |
| Ikon | Hati solid `sky-500` 18 px di pojok kanan bawah |
| Dekorasi | Setengah lingkaran amber di sudut kanan atas (menjorok keluar); panah biru melengkung di bawahnya mengarah ke kartu harga |

### 6.14 Kartu harga

| Properti | Spec |
|---|---|
| Surface | Putih, radius 28 px, padding 32 px, `shadow-lg`, max-width 420 px, `text-align: center` |
| Harga | "$297" — `price` 48 px / 800 / `ink-900` |
| Subteks | "One-time payment" — 14 px / 400 / `ink-500`, margin-top 4 px |
| Pill cicilan | bg `sky-100`, radius pill, padding 8 × 18 px, 14 px / 500 / `ink-700` — "or 2 payments of **$148.50**" (angka weight 700); margin-top 16 px |
| CTA | `btn-primary` lg, block (100%), margin-top 24 px — "Enroll Now – $297" |
| Garansi | Ikon shield-check 16 px `ink-500` + "14-Day Money-Back Guarantee" 13 px / 500 / `ink-500`; margin-top 16 px; center |
| Semantik | `<article>`; harga di `<p>` (bukan heading) |


---

## 7. Spesifikasi per Section

### 7.1 Hero

```text
+------------------------------------------------------------------------+
| [eyebrow]                                      .-------------.         |
|                                                |   (blob)    |         |
| H1 baris 1                                     | +---------+ |         |
| H1 baris 2                 +-----------+       | | CARD A  | |         |
| H1 baris 3 + smiley        |           |       | +---------+ |         |
|                            |   FOTO    |       | +---------+ |         |
| Sub-headline               |   MODEL   |       | | CARD B  | |         |
| (3 baris)                  |  cutout   |       | +---------+ |         |
|                            |           |       | +---------+ |         |
| [CTA] (>) Watch Promo      |           |       | | CARD C  | |         |
| (avatars) ***** teks       +-----------+       | +---------+ |         |
|                                                '-------------'         |
+------------------------------------------------------------------------+
```

Foto menjorok ±40 px ke kolom kiri (laptop model masuk ke area teks, tidak menimpa teks). Kartu A/B/C bertumpuk di sisi kanan foto.

```text
Hero (section#top)
├─ Kolom kiri  (flex-col, align tengah vertikal)
│  ├─ Eyebrow
│  ├─ H1 "The Social / Media Manager / Insider" + smiley
│  ├─ Sub-headline (max 440 px)
│  ├─ Baris CTA: [btn-primary lg] [btn-play]
│  └─ Social proof: [avatar x5] [bintang + teks]
└─ Kolom kanan (relative, min-height ±600 px)
   ├─ Blob sky-200 (absolute)
   ├─ Confetti (absolute, aria-hidden)
   ├─ Foto model (absolute, menempel ke dasar section)
   └─ Kartu melayang A · B · C (absolute)
```

| Properti | Spec |
|---|---|
| Section | `position: relative; overflow: hidden; background: #fff` |
| Padding | Atas 48 px (di bawah navbar) · bawah 0 (foto menempel ke dasar) |
| Tinggi | Min. ±640 px (desktop) |
| Grid | `grid-template-columns: 1.05fr .95fr; align-items: center` |
| Kolom kiri | `padding-bottom: 64px` |
| Spasi vertikal kiri | Eyebrow→H1 16 px · H1→sub 24 px · sub→CTA 32 px · CTA→social proof 32 px |
| Blob | Lingkaran ±620 px, `sky-200`, `right: -90px; top: 0`; terpotong tepi kanan & dasar section |
| Foto | Cutout transparan (WebP/PNG), tinggi ±590 px, `position: absolute; bottom: 0; left: 38%` |
| Layering | Blob < confetti < foto < kartu melayang < teks (lihat §4.9) |
| Kartu melayang | A: top 9% / right 13% · B: top 30% / right 2% · C: top 65% / right 3% (relatif kolom visual) |

### 7.2 Trust strip

| Properti | Spec |
|---|---|
| Struktur | `section` penuh lebar, bg `sky-100`; di dalam container: teks di atas, baris logo di bawah |
| Padding | 28–32 px vertikal |
| Gap teks → logo | 20 px |
| Detail | Lihat §6.8 |

### 7.3 What You'll Learn

```text
Section#whats-inside (padding-y 80 px, relative)
├─ Header (center, max-width 640 px)
│  ├─ Eyebrow "What You'll Learn"
│  ├─ H2 (2 baris)
│  └─ Squiggle amber (center)
├─ Grid 6 kartu (gap 20 px, margin-top 48 px)
└─ Confetti (4 buah, absolute)
```

| Properti | Spec |
|---|---|
| Background | Putih |
| Alignment | Header **center**; isi kartu **center** |
| Grid | ≥1024: 6 kolom · 768–1023: 3 kolom · <768: lihat §12 |
| Tinggi kartu | Seragam (stretch) |

### 7.4 Instructor

```text
Section#about (padding-y 48 px)
└─ Banner (radius 28 px, bg biru)
   ├─ Foto Sara (kiri, menempel ke dasar)
   ├─ Teks: eyebrow · H2 + smiley · bio · btn-white
   └─ Kredensial x4 (kanan)
```

| Properti | Spec |
|---|---|
| Background section | Putih |
| Alignment | Teks **left**; kredensial left dengan ikon di kiri |
| Perilaku tombol | "Learn More About Sara" → `#about-sara` / halaman bio / modal (tentukan) |
| Detail | Lihat §6.10–6.11 |

### 7.5 Pricing / CTA

```text
Section#enroll (band sky-100, padding-y 72 px)
├─ Kolom kiri
│  ├─ Eyebrow "Join Today"
│  ├─ H2 "Invest in your freedom" + squiggle (kiri)
│  ├─ Paragraf "A one-time investment ..."
│  ├─ Checklist x4   ── berdampingan ──   Note card + panah
│  └─ Confetti amber
└─ Kolom kanan: Kartu harga
```

| Properti | Spec |
|---|---|
| Background | `--grad-band` |
| Grid | `grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center` |
| Kolom kiri | Checklist (±60% lebar) dan note card (±40%) berdampingan; note card sedikit menjorok ke arah kartu harga |
| Alignment | Kolom kiri **left**; kartu harga **center** |
| Panah | Di bawah note card, melengkung ke arah tombol di kartu harga |

### 7.6 [Saran] Testimonials · FAQ · Footer

Tidak ada di referensi, tetapi dua link navbar menunjuk ke sana. Gunakan token & komponen yang sama.

**Testimonials (`#testimonials`)**

| Properti | Spec |
|---|---|
| Background | Putih |
| Header | Eyebrow "Testimonials" + H2 (mis. "Real students, real results") + squiggle center |
| Grid | 3 kolom, gap 24 px; mobile = carousel scroll-snap |
| Kartu | Gaya kartu fitur (putih, border `ink-100`, radius 20, `shadow-sm`), padding 24 px; avatar 48 px, kutipan 15 px / lh 1.6, bintang, nama; opsional pill hasil (`sky-100`, teks `sky-700`, 12 px / 600) |
| Konten | **Wajib testimoni nyata** dengan izin tertulis |

**FAQ (`#faq`)**

| Properti | Spec |
|---|---|
| Background | `sky-100` (atau putih jika section di atasnya biru) |
| Header | Eyebrow "FAQ" + H2 "Frequently asked questions" |
| Akordeon | Lebar max 760 px, center; item putih, radius 16 px, border `ink-100`, padding 20 × 24 px; pertanyaan 16 px / 700; ikon plus/minus `sky-600` (rotasi 45° saat terbuka); jawaban 15 px / lh 1.6 / `ink-700`; animasi tinggi 250 ms |
| Pertanyaan yang selaras dengan referensi | Who is this course for? · Do I need any experience? · How long do I get access? · Is there a payment plan? · What if the course isn't right for me? · Will there be updates and community support? |

**Footer**

| Properti | Spec |
|---|---|
| Surface | Putih dengan border-top `ink-100` (atau `ink-900` bila butuh penutup yang tegas) |
| Isi | Logo + tagline · link (Course, What's Inside, About, FAQ) · legal (Terms, Privacy, Refund Policy) · ikon sosial · disclaimer hasil · "© 2026 Volume One Studios" |
| Disclaimer | "Results vary and are not guaranteed." (sesuaikan dengan hukum setempat) |

---

## 8. Copywriting (teks persis dari referensi)

### 8.1 Navbar

| Elemen | Teks |
|---|---|
| Link | Home · Course · What's Inside · About · Testimonials · FAQ |
| CTA | Enroll Now – $297 |

### 8.2 Hero

| Elemen | Teks |
|---|---|
| Eyebrow | The ultimate beginner-friendly course |
| H1 | The Social Media Manager Insider |
| Sub-headline | Learn how to become a freelance social media manager, land clients, and build the freedom lifestyle you've been dreaming of. |
| CTA utama | Enroll Now – $297 |
| CTA sekunder | Watch Promo |
| Social proof | Join 2,000+ students building their social media business |
| Kartu A | Build a business that gives you freedom |
| Kartu B | Monthly Income · $8,750 · +28% this month |
| Kartu C | This course changed my life. I quit my 9-5 and now work from anywhere! — Jenna B. (5 bintang) |
| Teks pada mug (foto) | content creates freedom |

### 8.3 Trust strip

| Elemen | Teks |
|---|---|
| Judul | Trusted by aspiring social media managers worldwide |
| Logo | Instagram · TikTok · Shopify · Pinterest · Canva |

### 8.4 What You'll Learn

| Elemen | Teks |
|---|---|
| Eyebrow | What You'll Learn |
| H2 | Everything you need to build a successful SMM business |

| # | Ikon | Judul | Deskripsi |
|---|---|---|---|
| 1 | Roket | Start Your SMM Business | Learn the exact steps to get started with no experience. |
| 2 | Dua orang | Find & Land Clients | Discover how to find clients and pitch your services. |
| 3 | Koin "$" (amber) | Price Your Services | Learn how to price with confidence and get paid what you're worth. |
| 4 | Smartphone | Content & Strategy Mastery | Create scroll-stopping content and winning strategies for any niche. |
| 5 | Koper | Workflows & Systems | Build systems that save time and scale your business. |
| 6 | Grafik naik + panah | Scale Into an Agency | Go from solo to scaling with a team and multiple clients. |

### 8.5 Instructor

| Elemen | Teks |
|---|---|
| Eyebrow | Meet Your Instructor |
| H2 | Hi, I'm Sara! |
| Bio | I went from a broke freelancer to a 6-figure social media agency owner. I teach aspiring social media managers how to build profitable, freedom-based businesses of their own. |
| Tombol | Learn More About Sara |
| Kredensial | 6-Figure Agency Owner · Thousands of Students · Proven Systems & Strategies · Real-World Experience |

### 8.6 Pricing

| Elemen | Teks |
|---|---|
| Eyebrow | Join Today |
| H2 | Invest in your freedom |
| Paragraf | A one-time investment that can change your life forever. |
| Checklist | Lifetime access to the course · Templates, resources & tools · Private student community · New updates included |
| Note card | Your future self will thank you. |
| Harga | $297 |
| Subteks | One-time payment |
| Pill cicilan | or 2 payments of $148.50 |
| CTA | Enroll Now – $297 |
| Garansi | 14-Day Money-Back Guarantee |

### 8.7 Aturan copy

- Heading, judul kartu, dan CTA = *Title Case*; deskripsi & microcopy = *Sentence case*.
- CTA menyebut aksi + harga dan **tidak berubah** di seluruh halaman: `Enroll Now – $297`.
- Format angka: `$297`, `$148.50`, `$8,750`, `2,000+` (pemisah ribuan koma, simbol `$` tanpa spasi).
- Gunakan orang pertama untuk suara instruktur ("I went from…"), orang kedua untuk ajakan ("Invest in your freedom").
- Tidak memakai tanda seru kecuali sapaan ("Hi, I'm Sara!") dan testimoni.


---

## 9. Panduan Gambar & Fotografi

### 9.1 Aset foto

| Aset | Rasio / ukuran | Art direction |
|---|---|---|
| Foto hero (model) | Cutout transparan, ≥1000 × 1180 px (@2x) | Perempuan 25–35 th, rambut cokelat panjang bergelombang, kemeja button-up biru muda (chambray) + celana krem; senyum lebar menatap kamera; satu tangan memegang laptop perak terbuka (miring), tangan lain memegang mug putih bertuliskan "content creates freedom"; crop dari kepala sampai paha; tepi cutout bersih tanpa halo putih |
| Foto instruktur (Sara) | 4:3, ≥760 × 570 px | Perempuan berambut panjang bergelombang, atasan blush/pink pastel, duduk di meja putih dengan MacBook perak dan ponsel; ruang kerja terang dengan tanaman & rak putih di latar; senyum natural menatap kamera; depth of field dangkal |
| Avatar social proof ×5 | 1:1, 96 × 96 px (tampil 40 px) | Close-up wajah, beragam gender/etnis/usia, latar netral, crop kepala–bahu |
| Avatar testimoni | 1:1, 64 × 64 px | Perempuan berambut gelap, tersenyum, latar netral |

### 9.2 Gaya fotografi

- Terang (high-key), hangat, natural — cahaya jendela/studio lembut, tanpa filter berat.
- Wardrobe pastel (biru muda, krem, blush) selaras dengan palet; hindari hitam pekat dan pola ramai.
- Ekspresi: senyum tulus, kontak mata ke kamera, pose santai & terbuka.
- Warna kulit & white balance konsisten antar foto.
- Props kerja (laptop, mug, tanaman) tampil jelas untuk menegaskan tema "kerja dari mana saja".

### 9.3 Teknis

- Format WebP/AVIF (+ fallback JPG/PNG). Foto hero: `fetchpriority="high"`; sisanya `loading="lazy"`.
- Selalu set `width` & `height` (cegah layout shift) dan `decoding="async"`.
- Contoh `alt`:
  - Hero: `Smiling woman holding a laptop and a mug that reads "content creates freedom"`
  - Instruktur: `Sara, the course instructor, smiling at her desk with a laptop`
  - Avatar dalam grup yang sudah berlabel: `alt=""`

---

## 10. Ikon

**Gaya:** flat *duotone* untuk ikon kartu fitur (warna utama `sky-600` + tint `sky-300`), sudut membulat; ikon garis (stroke 1,75–2 px, ujung round) untuk kredensial & UI. Ukuran: 44–48 px (fitur) · 24–28 px (kredensial) · 16–20 px (UI).

| Lokasi | Ikon | Padanan Lucide / Phosphor | Warna |
|---|---|---|---|
| Fitur 1 | Roket | `rocket` | `sky-600` + api `sky-300` |
| Fitur 2 | Dua orang | `users` | `sky-600` + `sky-300` |
| Fitur 3 | Koin "$" | `circle-dollar-sign` (custom) | Lingkaran `sun-300`, simbol `sun-600` |
| Fitur 4 | Smartphone | `smartphone` | `sky-600` |
| Fitur 5 | Koper | `briefcase` | `sky-600` |
| Fitur 6 | Grafik naik + panah | `trending-up` / `chart-column-increasing` | `sky-600` |
| Kredensial 1 | Medali | `award` | Putih |
| Kredensial 2 | Grup orang | `users` | Putih |
| Kredensial 3 | Diagram alur | `workflow` | Putih |
| Kredensial 4 | Grafik batang | `bar-chart-3` (alias `chart-column`) | Putih |
| UI | Hati | `heart` (fill) | `sky-500` |
| UI | Play | `play` (fill) | `sky-500` |
| UI | Centang | `check` dalam lingkaran | Putih di atas `sky-500` |
| UI | Perisai | `shield-check` | `ink-500` |
| UI | Bintang | `star` (fill) | `sun-500` |
| UI | Menu / tutup / panah | `menu` · `x` · `chevron-down` | `ink-900` |

---

## 11. Interaksi & Motion

**Prinsip:** hemat. Satu momen terorkestrasi (hero saat load); selebihnya hanya respons terhadap aksi pengguna. Referensi bersifat statis, jadi seluruh tabel ini adalah **[Saran]**.

| Elemen | Trigger | Efek | Durasi / easing | Prioritas |
|---|---|---|---|---|
| Teks hero | Load | Fade-up 16 px, stagger 80 ms (eyebrow → H1 → sub → CTA → social proof) | 500 ms `--ease-out` | Inti |
| Foto & kartu melayang | Load | Foto fade + `scale(.98→1)`; kartu muncul stagger 120 ms | 600 ms | Inti |
| Kartu melayang | Loop | Float ±8 px | 6 s `ease-in-out` | Opsional |
| Tombol | Hover / press | Lihat §6.3 | 200 ms | Wajib |
| Link navbar | Hover | Underline tumbuh | 200 ms | Wajib |
| Navbar | Scroll > 8 px | Blur + border-bottom muncul | 200 ms | Wajib |
| Kartu fitur | Hover | Naik 4 px + `shadow-md` | 250 ms | Wajib |
| Sparkline & angka | In-view (sekali) | Garis tergambar (`stroke-dashoffset`), angka count-up | 1,2 s | Opsional |
| Akordeon FAQ | Klik | Tinggi + rotasi ikon | 250 ms | Wajib (jika FAQ dibuat) |
| Drawer mobile | Klik | Slide dari kanan + backdrop fade | 300 ms | Wajib |
| Section lain | Scroll | **Tidak ada** reveal massal | — | — |

**Reduced motion:** matikan float, count-up, dan reveal berbasis translate; sisakan fade ≤150 ms.

---

## 12. Responsif

Uji di lebar: 360 · 390 · 768 · 1024 · 1280 · 1440.

| Section | Desktop ≥1024 | Tablet 768–1023 | Mobile <768 |
|---|---|---|---|
| Navbar | Link terlihat, CTA di kanan | Hamburger + CTA md | Hamburger; CTA pindah ke drawer. **[Saran]** Sticky bottom bar "Enroll Now – $297" muncul setelah hero, sembunyi saat Pricing terlihat |
| Hero | 2 kolom | 1 kolom: teks lalu visual (tinggi visual ±520 px) | 1 kolom; H1 40 px; tombol full-width bertumpuk (primary di atas); visual ±420 px; kartu A disembunyikan <480 px; kartu B & C skala .85 |
| Trust strip | 1 baris, gap 64 | 1 baris, gap 40 | 3 + 2 baris atau marquee |
| Learn | 6 kolom | 3 kolom × 2 baris | 2 kolom (480–767); <480: 1 kolom horizontal (ikon kiri 40 px, teks rata kiri) |
| Instructor | 3 kolom | 2 kolom: foto + teks; kredensial 2×2 di bawah | 1 kolom: foto (4:3, radius 20) → teks → tombol full-width → kredensial 1 kolom; padding banner 16 px |
| Pricing | 2 kolom | 1 kolom: copy lalu kartu harga (max-w 480 px, center) | 1 kolom; note card pindah ke bawah checklist (rotasi dipertahankan), panah disembunyikan; kartu harga full-width |

**Global mobile:** padding container 20 px · padding-y section 56 px · confetti dikurangi ±50% · target sentuh ≥44 px · font body ≥15 px.

---

## 13. Aksesibilitas

### 13.1 Kontras warna

Rasio di bawah adalah **estimasi** dari hex yang diperkirakan; hitung ulang dengan alat kontras setelah warna final disepakati.

| Pasangan | Rasio | Status | Perbaikan |
|---|---|---|---|
| `ink-900` di atas putih | ±16,9:1 | ✅ AAA | — |
| `ink-700` di atas putih | ±10,8:1 | ✅ AAA | — |
| `ink-500` di atas putih | ±5,4:1 | ✅ AA | — |
| `ink-500` di atas `sky-100` | ±4,9:1 | ✅ AA | — |
| **Putih di atas `sky-500`** (tombol, banner) | ±2,3:1 | ❌ Gagal | Pakai `sky-700` (±4,9:1), atau ganti teks ke `ink-900` (±7,5:1) |
| `ink-900` di atas `sky-500` | ±7,5:1 | ✅ AAA | Alternatif bila tombol tetap `sky-500` |
| Putih di atas `sky-600` | ±3,0:1 | ⚠️ Hanya teks besar / komponen UI | — |
| Putih di atas `sky-700` | ±4,9:1 | ✅ AA | — |
| `sky-600` sebagai teks kecil di atas putih (eyebrow, link) | ±3,0:1 | ❌ Gagal | Pakai `sky-700` |
| `sky-700` sebagai teks di atas `sky-100` | ±4,4:1 | ❌ Tipis | Pakai `sky-800` (±5,9:1) |
| `sun-500` di atas putih | ±1,9:1 | ❌ | Dekoratif saja; jangan untuk teks |

**Dua mode warna** (satu atribut pada `<html>`):

- **Fidelity** (default di dokumen ini) — meniru referensi persis; kontras tombol/banner di bawah AA.
- **AA** — `<html data-contrast="aa">`: tombol, banner, eyebrow, dan link memakai `sky-700`/`sky-800`. **Disarankan untuk produksi.** Tampilan tetap satu keluarga warna, hanya biru-nya sedikit lebih dalam.

### 13.2 Checklist

- Semantik: `header`, `nav`, `main`, `section`, `footer`; **satu** `<h1>`, `<h2>` per section, `<h3>` untuk judul kartu.
- Dekorasi (blob, confetti, smiley, squiggle, panah): `aria-hidden="true"`.
- Rating bintang: `role="img"` + `aria-label="Rated 5 out of 5"`.
- Logo strip: setiap logo punya `alt` nama brand.
- "Watch Promo" membuka modal video: focus trap, `Esc` menutup, `aria-modal="true"`, fokus kembali ke tombol.
- Focus-visible jelas di semua elemen interaktif; urutan tab mengikuti urutan visual.
- Target sentuh ≥44 × 44 px.
- Kartu melayang berisi konten nyata → tetap terbaca screen reader; letakkan di DOM setelah H1 & CTA.
- Hormati `prefers-reduced-motion`; tidak ada animasi berkedip >3×/detik.
- Zoom 200% tanpa scroll horizontal; teks tidak terpotong.
- `<html lang="en">` (copy berbahasa Inggris); sediakan *skip link* "Skip to content".
- Klaim penghasilan disertai disclaimer (lihat §17).

---

## 14. Implementasi

### 14.1 CSS variables

```css
:root {
  /* Sky */
  --sky-50:  #F5FAFE;
  --sky-100: #EAF5FD;
  --sky-200: #D6ECFB;
  --sky-300: #A9D8F7;
  --sky-500: #4DB6F3;
  --sky-600: #2A9BE6;
  --sky-700: #1673C4;
  --sky-800: #0F5FA8;

  /* Ink */
  --ink-900: #0F1B3D;
  --ink-700: #2F3D5E;
  --ink-500: #5B6B84;
  --ink-300: #B8C4D4;
  --ink-200: #DCE5EF;
  --ink-100: #EEF3F8;

  /* Sun */
  --sun-300: #FCD08A;
  --sun-500: #F9AE41;
  --sun-600: #EE9418;

  /* Surface */
  --white: #FFFFFF;
  --surface-glass: rgba(255, 255, 255, .92);
  --on-banner-muted: rgba(255, 255, 255, .85);
  --divider-on-blue: rgba(255, 255, 255, .25);

  /* Gradients */
  --grad-banner: linear-gradient(135deg, #56BBF5 0%, #44AEF0 100%);
  --grad-band:   linear-gradient(180deg, #EAF5FD 0%, #F4FAFE 100%);
  --grad-chart:  linear-gradient(180deg, rgba(77,182,243,.30) 0%, rgba(77,182,243,0) 100%);

  /* Semantic — mode "fidelity" (meniru referensi) */
  --action-bg:        var(--sky-500);
  --action-bg-hover:  var(--sky-600);
  --action-fg:        #fff;
  --link-blue:        var(--sky-600);
  --eyebrow:          var(--sky-600);
  --eyebrow-on-tint:  var(--sky-600);
  --banner-bg:        var(--grad-banner);

  /* Typography */
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --fs-display: clamp(2.5rem, 1.6rem + 3.4vw, 4rem);      /* 40 → 64 */
  --fs-h2-lg:   clamp(1.75rem, 1.3rem + 1.4vw, 2.25rem);  /* 28 → 36 */
  --fs-h2:      clamp(1.625rem, 1.3rem + 1vw, 2rem);      /* 26 → 32 */
  --fs-price:   clamp(2.75rem, 2.5rem + .8vw, 3rem);      /* 44 → 48 */
  --fs-stat:    1.75rem;     /* 28 */
  --fs-h3:      1.0625rem;   /* 17 */
  --fs-body-lg: 1.125rem;    /* 18 */
  --fs-body:    1rem;        /* 16 */
  --fs-body-sm: .875rem;     /* 14 */
  --fs-caption: .8125rem;    /* 13 */

  /* Spacing (basis 4px) */
  --space-1: .25rem;  --space-2: .5rem;   --space-3: .75rem;  --space-4: 1rem;
  --space-5: 1.25rem; --space-6: 1.5rem;  --space-8: 2rem;    --space-10: 2.5rem;
  --space-12: 3rem;   --space-16: 4rem;   --space-20: 5rem;   --space-24: 6rem;

  /* Radius */
  --r-sm: 8px; --r-md: 16px; --r-lg: 20px; --r-xl: 28px; --r-pill: 999px; --r-full: 50%;

  /* Shadow */
  --shadow-xs:  0 1px 2px rgba(15,27,61,.04);
  --shadow-sm:  0 4px 14px rgba(32,92,160,.06);
  --shadow-md:  0 10px 30px rgba(32,92,160,.12);
  --shadow-lg:  0 24px 60px rgba(32,92,160,.16);
  --shadow-btn: 0 8px 20px rgba(77,182,243,.38);

  /* Layout */
  --container: 1200px;
  --gutter: clamp(1.25rem, 4vw, 2.5rem);   /* 20 → 40 */
  --nav-h: 80px;

  /* Motion */
  --dur-fast: 150ms;  --dur-base: 250ms;  --dur-slow: 600ms;
  --ease-out: cubic-bezier(.22, 1, .36, 1);
}

/* Mode AA — disarankan untuk produksi */
:root[data-contrast="aa"] {
  --action-bg:        var(--sky-700);
  --action-bg-hover:  var(--sky-800);
  --link-blue:        var(--sky-700);
  --eyebrow:          var(--sky-700);
  --eyebrow-on-tint:  var(--sky-800);
  --banner-bg:        var(--sky-700);
  --shadow-btn:       0 8px 20px rgba(22,115,196,.30);
}
```

### 14.2 Base styles & komponen inti

```css
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: var(--nav-h); }
body { margin: 0; font-family: var(--font-sans); color: var(--ink-700); background: var(--white); -webkit-font-smoothing: antialiased; }
h1, h2, h3 { color: var(--ink-900); text-wrap: balance; margin: 0; }
.container { max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter); }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; min-height: 44px;
  border-radius: var(--r-pill); font: 600 .9375rem/1 var(--font-sans); text-decoration: none; cursor: pointer;
  transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), background-color var(--dur-base); }
.btn-primary { background: var(--action-bg); color: var(--action-fg); box-shadow: var(--shadow-btn); padding-inline: 1.5rem; }
.btn-primary:hover { background: var(--action-bg-hover); transform: translateY(-2px); }
.btn-primary:active { transform: scale(.98); }
.btn-lg { min-height: 56px; padding-inline: 2.25rem; font-size: 1.125rem; font-weight: 700; }
.btn:focus-visible { outline: 3px solid rgba(77,182,243,.45); outline-offset: 2px; }

.card-feature { background: #fff; border: 1px solid var(--ink-100); border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm); padding: 1.5rem 1rem; text-align: center;
  transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base), border-color var(--dur-base); }
.card-feature:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--sky-200); }

.card-float { position: absolute; background: var(--surface-glass); border-radius: var(--r-lg);
  box-shadow: var(--shadow-md); padding: 1rem; animation: float var(--float-dur, 6s) ease-in-out infinite; }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
```

### 14.3 Tailwind (opsional)

```js
// tailwind.config.js
// Catatan: `sky` di bawah menimpa shade 50/100/200/300/500/600/700/800 milik Tailwind.
// Ganti nama menjadi `brand` bila ingin mempertahankan palet bawaan.
module.exports = {
  theme: {
    extend: {
      colors: {
        sky: { 50: '#F5FAFE', 100: '#EAF5FD', 200: '#D6ECFB', 300: '#A9D8F7', 500: '#4DB6F3', 600: '#2A9BE6', 700: '#1673C4', 800: '#0F5FA8' },
        ink: { 100: '#EEF3F8', 200: '#DCE5EF', 300: '#B8C4D4', 500: '#5B6B84', 700: '#2F3D5E', 900: '#0F1B3D' },
        sun: { 300: '#FCD08A', 500: '#F9AE41', 600: '#EE9418' },
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      borderRadius: { sm: '8px', md: '16px', lg: '20px', xl: '28px' },
      boxShadow: {
        sm: '0 4px 14px rgba(32,92,160,.06)',
        md: '0 10px 30px rgba(32,92,160,.12)',
        lg: '0 24px 60px rgba(32,92,160,.16)',
        btn: '0 8px 20px rgba(77,182,243,.38)',
      },
      maxWidth: { container: '1200px' },
      keyframes: { float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } } },
      animation: { float: 'float 6s ease-in-out infinite' },
    },
  },
};
```

### 14.4 Kerangka HTML semantik

```html
<body id="top">
  <a class="skip-link" href="#main">Skip to content</a>

  <header class="navbar">
    <div class="container navbar__inner">
      <a href="#top" class="logo" aria-label="Volume One Studios, home">…</a>
      <nav aria-label="Primary">
        <ul>
          <li><a href="#top" aria-current="page">Home</a></li>
          <li><a href="#enroll">Course</a></li>
          <li><a href="#whats-inside">What's Inside</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#testimonials">Testimonials</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
      </nav>
      <a href="#enroll" class="btn btn-primary">Enroll Now – $297</a>
    </div>
  </header>

  <main id="main">
    <section class="hero" aria-labelledby="hero-title">… <h1 id="hero-title">The Social Media Manager Insider</h1> …</section>
    <section class="trust" aria-label="Trusted by">…</section>
    <section id="whats-inside" aria-labelledby="learn-title">… <h2 id="learn-title">…</h2> …</section>
    <section id="about" aria-labelledby="about-title">… <h2 id="about-title">Hi, I'm Sara!</h2> …</section>
    <section id="enroll" aria-labelledby="enroll-title">… <h2 id="enroll-title">Invest in your freedom</h2> …</section>
    <!-- [Saran] #testimonials, #faq -->
  </main>

  <footer>…</footer>
</body>
```

### 14.5 Struktur komponen, performa & analitik

- **Komponen (React/Vue/Astro):** `Navbar`, `Logo`, `Button`, `Eyebrow`, `SectionHeading`, `SocialProof`, `FloatingCard` (varian `benefit` / `stat` / `testimonial`), `LogoStrip`, `FeatureCard`, `InstructorBanner`, `CredentialItem`, `Checklist`, `NoteCard`, `PricingCard`, dan dekorasi `Confetti`, `Squiggle`, `Smiley`, `Blob`.
- **Performa:** preload font utama (`font-display: swap`) dan foto hero; set dimensi semua gambar; ikon & dekorasi sebagai SVG inline; target LCP < 2,5 s, CLS < 0,1.
- **Analitik [Saran]:** event `cta_click` dengan properti `location` = `navbar` | `hero` | `pricing` | `sticky`; event `promo_play`.
- **Satu sumber CTA:** ketiga tombol "Enroll Now – $297" mengarah ke URL checkout yang sama (satu konstanta).
- **Meta [Saran]:** `<title>` "The Social Media Manager Insider — Beginner-Friendly Social Media Manager Course"; OG image 1200 × 630 px (logo + H1 + foto model).

---

## 15. Checklist Aset

| Aset | Format | Catatan |
|---|---|---|
| Logo Volume One Studios | SVG (warna penuh + putih/mono) | Versi ikon saja untuk favicon |
| Foto hero (cutout) | WebP/PNG transparan, ≥1000 × 1180 px | `fetchpriority="high"` |
| Foto instruktur | WebP/AVIF, ≥760 × 570 px | — |
| Avatar ×5 + avatar testimoni | WebP 96 × 96 / 64 × 64 px | Wajib ada izin tertulis (model release) |
| 6 ikon fitur | SVG duotone, 48 px | Lihat §10 |
| 4 ikon kredensial | SVG outline putih, 24 px | Lihat §10 |
| Ikon UI | SVG: heart, play, check, shield-check, star, menu, x, chevron | Lucide / Phosphor |
| Logo Instagram, TikTok, Shopify, Pinterest, Canva | SVG monokrom | Ambil dari brand kit resmi masing-masing; cek ketentuan pemakaian |
| Dekorasi: smiley, squiggle, confetti, panah, blob | SVG inline | Snippet di §5 |
| Video promo | MP4/WebM + poster | Untuk modal "Watch Promo" |
| Favicon & OG image | 32 / 180 / 512 px · OG 1200 × 630 px | Pakai ikon logo |
| Font | Plus Jakarta Sans (400–800) | Self-host atau Google Fonts |

---

## 16. Do & Don't

| ✅ Do | ❌ Don't |
|---|---|
| Pertahankan satu warna & satu label CTA di semua tempat | Menambah warna tombol lain (mis. oranye) |
| Pakai shadow bertint biru, blur besar, opacity rendah | Shadow hitam pekat atau keras |
| Batasi confetti ±3–5 per layar, posisi tetap | Menaruh confetti di atas teks, CTA, atau wajah |
| Pakai radius konsisten sesuai tingkat komponen (§4.5) | Mencampur sudut tajam dan membulat |
| Pakai foto manusia asli yang hangat dan cerah | Foto gelap, dingin, atau stok generik yang kaku |
| Beri ruang putih lega antar section | Memadatkan section tanpa jeda |
| Heading *Title Case*, deskripsi *Sentence case* | Heading semua huruf kapital |
| Pakai mode AA untuk teks kecil di atas biru | Teks putih kecil di atas `sky-500` |

---

## 17. Asumsi, Batasan & Catatan

1. **Satu gambar statis** → semua hex, ukuran, dan jarak adalah estimasi. Jika ada file sumber (Figma/PSD), verifikasi dengan eyedropper dan ukur ulang, lalu perbarui token di §4.
2. **Tidak terlihat di referensi** (semua berlabel **[Saran]**): state hover/focus/active, tampilan tablet & mobile, animasi, modal video, section Testimonials/FAQ, footer, sticky bar mobile.
3. **Font** adalah tebakan terbaik dari bentuk huruf; ganti bila brand punya font resmi.
4. **Ikon & foto** pada referensi tampak seperti mockup/ilustrasi konsep. Aset final harus dibuat atau dilisensikan sendiri; foto orang membutuhkan model release.
5. **Hak merek & klaim "Trusted by":** logo Instagram, TikTok, Shopify, Pinterest, dan Canva adalah merek pihak ketiga. Pakai aset resmi dan pastikan teks tidak menyiratkan kemitraan/endorsement yang tidak ada — pertimbangkan teks seperti "Platforms you'll learn to work with" bila tidak ada kerja sama resmi.
6. **Klaim hasil:** kartu "Monthly Income $8,750 · +28% this month", testimoni "I quit my 9-5", "2,000+ students", dan "6-Figure Agency Owner" adalah klaim yang harus bisa dibuktikan. Gunakan data/testimoni nyata, tambahkan disclaimer "Results vary" di dekat kartu dan di footer, dan patuhi regulasi iklan setempat.
7. **Di luar cakupan:** halaman checkout/pembayaran, backend, dan integrasi email.

### QA sebelum rilis

- [ ] Semua teks sesuai §8 (termasuk en dash pada CTA)
- [ ] Token warna, radius, dan shadow sesuai §4 (tidak ada nilai "liar")
- [ ] Kontras lulus AA — mode `data-contrast="aa"` diuji (§13)
- [ ] Tiga tombol "Enroll Now – $297" mengarah ke URL yang sama
- [ ] Responsif di 360 / 390 / 768 / 1024 / 1280 / 1440
- [ ] Navigasi keyboard penuh; focus ring terlihat
- [ ] `prefers-reduced-motion` dihormati
- [ ] LCP < 2,5 s dan CLS < 0,1
- [ ] Disclaimer klaim hasil terpasang; logo merek & foto berizin
- [ ] Meta, OG image, dan favicon terpasang
