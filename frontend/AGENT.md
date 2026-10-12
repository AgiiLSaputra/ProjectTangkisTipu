# AGENT.md — Aturan Kerja Project TangkisTipu

## Status project
- Project ini **mandiri**. File `TangkisTipu.html` hanya dipakai sebagai contoh referensi UI/UX lama dan **tidak** diimpor, disalin, atau dihubungkan ke kode React/Vite.
- Stack: React 18 + Vite. Styling: Tailwind via CDN dengan konfigurasi token warna/tipografi yang sudah ada di `index.html`. Font: Plus Jakarta Sans + Material Symbols Outlined.

## Struktur
```
index.html          # head, font, tailwind CDN + tailwind.config (token warna dll.)
src/main.jsx        # entry point
src/App.jsx         # komponen halaman utama (sections)
src/components/    # satu komponen per section: Navbar, Hero, JalurBelajar, SimulasiChat, Footer,
                   # halaman: BelajarModus, KanalLaporPage (KanalHero, KanalPrinsipDasar,
                   # KanalGoldenPeriod, KanalDirektoriLapor, KanalChecklistBukti, KanalPenutup)
public/assets/      # semua foto/aset statis (logo, hero, dll), diakses via /assets/...
```

## Aturan konten & bahasa
- Bahasa UI selalu Bahasa Indonesia, nada ramah, jelas, dan tidak menakut-nakuti.
- Ikuti PRD-TangkisTipu.md untuk fitur dan alur.
- Setiap info modus/kanal pelaporan wajib merujuk sumber resmi (OJK, Satgas PASTI, Komdigi, Polri) dan mencantumkan sumber.
- Jangan mengumpulkan data pribadi peserta (nama asli, nomor HP, email). Identitas hanya nama panggilan + kode peserta anonim.
- Situs selalu menegaskan diri **bukan** kanal pelaporan resmi.

## Aturan desain
- Patokan visual: `DESIGN.md` (token warna, radius, shadow, tipografi, spacing). Jika konten tidak cocok, boleh redesign selama tetap konsisten dengan token itu.
- Mobile-first, target sentuh ≥ 44px, huruf besar & kontras tinggi untuk jalur Lansia.
- Dekorasi (blob, ikon, squiggle) wajib `aria-hidden` dan tidak menimpa teks/CTA.
- Hormati `prefers-reduced-motion`; tombol/mikro-interaksi 200–250ms ease-out.

## Aturan kode
- Komponen fungsi React, state dengan `useState`, tanpa library tambahan kecuali diminta.
- Ikon memakai Material Symbols Outlined (sudah diload via Google Fonts).
- Semua section punya `id` anchor (mis. `jalur-belajar`, `simulasi-chat`, `kanal-lapor`).
- Jalankan `npm run dev` untuk pengembangan, `npm run build` untuk memastikan tidak ada error sebelum commit.

## Aturan Struktur Komponen (WAJIB untuk halaman baru)
Setiap halaman baru HARUS dipecah menjadi komponen-komponen kecil, bukan satu file besar. Pola yang dipakai:

```
src/
  App.jsx               # komposisi komponen, state bersama (useState) bila perlu
  components/
    Navbar.jsx          # navbar sticky (logo, menu tengah, CTA kanan)
    Hero.jsx            # section hero/header atas
    <NamaSection>.jsx   # satu section per file, PascalCase, default export
    Footer.jsx          # footer
```

Aturan:
- Satu fungsi komponen per file, nama file = nama komponen (contoh: `KatalogModus.jsx`).
- Komponen berisi hanya section-nya sendiri dan mengembalikan satu elemen (boleh dibungkus `<>...</>`).
- State/interaksi yang dipakai lintas komponen diangkat ke `App.jsx` lalu dikirim via props (contoh: `feedback` & `setFeedback` ke `SimulasiChat`).
- Komponen tidak mengimpor CSS sendiri; styling tetap utility Tailwind dari `index.html`.
- Aset statis (foto, logo) taruh di `public/assets/` dan referensikan dengan path `/assets/...`, bukan import.
- Saat menambah halaman: buat file komponen baru di `src/components/`, lalu daftarkan di `App.jsx`. Jangan menambah blok besar langsung di `App.jsx`.
