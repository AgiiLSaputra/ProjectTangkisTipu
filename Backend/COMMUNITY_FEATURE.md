# Fitur Komunitas TangkisTipu

## Overview

Fitur komunitas memungkinkan admin dan peserta untuk berbagi:
- **Curhat korban**: Pengalaman pribadi korban penipuan
- **Modus baru**: Informasi tentang modus penipuan terbaru
- **Tips aman**: Edukasi dan tips menghindari penipuan
- **Postingan edukasi**: Konten edukatif lainnya

## Fitur Utama

### Untuk Admin
- ✅ **Posting dengan centang biru**: Admin mendapat verified badge
- ✅ **Moderasi penuh**: Dapat menghapus semua postingan
- ✅ **Dashboard komunitas**: Panel khusus untuk mengelola konten
- ✅ **Filter dan pencarian**: Lihat postingan berdasarkan author type

### Untuk Peserta (Public)
- ✅ **Posting cerita**: Bagikan pengalaman pribadi
- ✅ **Like dan bookmark**: Interaksi dengan postingan
- ✅ **Komentar dan reply**: Diskusi di postingan
- ✅ **Tag kategorisasi**: Filter berdasarkan kategori modus
- ✅ **Pencarian**: Cari postingan berdasarkan keyword

## Setup Database

### 1. Jalankan Migration

```bash
cd Backend
npm run migrate
```

Migration akan membuat tabel:
- `community_posts`: Postingan komunitas
- `community_comments`: Komentar dan reply
- `community_likes`: Data like
- `community_bookmarks`: Data bookmark

### 2. Struktur Database

**community_posts**
```sql
- id (UUID): Primary key
- author_id (UUID): ID peserta atau admin
- author_type (TEXT): 'participant' atau 'admin'
- author_name (TEXT): Nama yang ditampilkan
- author_handle (TEXT): Handle @username
- tag (TEXT): Kategori (Umum, Modus Baru, dll)
- content (TEXT): Konten postingan
- image_url (TEXT): URL gambar (optional)
- likes_count (INT): Jumlah like
- comments_count (INT): Jumlah komentar
- created_at (TIMESTAMPTZ): Waktu dibuat
- updated_at (TIMESTAMPTZ): Waktu update
```

**community_comments**
```sql
- id (UUID): Primary key
- post_id (UUID): ID postingan
- parent_id (UUID): ID parent comment (untuk reply)
- author_id (UUID): ID author
- author_type (TEXT): 'participant' atau 'admin'
- author_name (TEXT): Nama author
- author_handle (TEXT): Handle author
- content (TEXT): Konten komentar
- created_at (TIMESTAMPTZ): Waktu dibuat
```

**community_likes**
```sql
- id (UUID): Primary key
- post_id (UUID): ID postingan
- user_id (UUID): ID user yang like
- user_type (TEXT): 'participant' atau 'admin'
- created_at (TIMESTAMPTZ): Waktu like
- UNIQUE(post_id, user_id, user_type)
```

**community_bookmarks**
```sql
- id (UUID): Primary key
- post_id (UUID): ID postingan
- user_id (UUID): ID user yang bookmark
- user_type (TEXT): 'participant' atau 'admin'
- created_at (TIMESTAMPTZ): Waktu bookmark
- UNIQUE(post_id, user_id, user_type)
```

## API Endpoints

### Public Endpoints (Optional Auth)

#### GET /api/community/posts
List semua postingan dengan pagination dan filter.

**Query Parameters:**
- `tag` (string): Filter berdasarkan tag
- `search` (string): Pencarian keyword
- `limit` (number): Jumlah per halaman (default: 20, max: 100)
- `offset` (number): Offset pagination (default: 0)

**Headers (Optional):**
- `X-Participant-Token`: Token peserta untuk mendapat info like/bookmark
- `Authorization: Bearer <token>`: Token admin

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "author": {
        "id": "uuid",
        "type": "admin|participant",
        "name": "Nama",
        "handle": "@handle",
        "verified": true|false
      },
      "tag": "Modus Baru",
      "content": "Konten postingan...",
      "image_url": null,
      "likes_count": 42,
      "comments_count": 5,
      "user_liked": false,
      "user_bookmarked": false,
      "created_at": "2026-10-12T14:00:00Z",
      "updated_at": "2026-10-12T14:00:00Z"
    }
  ]
}
```

#### GET /api/community/posts/:postId
Detail postingan dengan semua komentar.

**Response:**
```json
{
  "post": { /* ... */ },
  "comments": [
    {
      "id": "uuid",
      "author": { /* ... */ },
      "content": "Komentar...",
      "created_at": "2026-10-12T14:00:00Z",
      "replies": [
        {
          "id": "uuid",
          "author": { /* ... */ },
          "content": "Reply...",
          "created_at": "2026-10-12T14:01:00Z"
        }
      ]
    }
  ]
}
```

### Protected Endpoints (Require Auth)

#### POST /api/community/posts
Buat postingan baru.

**Headers:**
- `X-Participant-Token` atau `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "Konten postingan (1-2000 karakter)",
  "tag": "Modus Baru",
  "image_url": "https://example.com/image.jpg" // optional
}
```

**Response:**
```json
{
  "post": { /* ... */ }
}
```

#### PATCH /api/community/posts/:postId
Update postingan (hanya author).

**Body:**
```json
{
  "content": "Konten baru",
  "tag": "Tips Aman"
}
```

#### DELETE /api/community/posts/:postId
Hapus postingan (author atau admin).

#### POST /api/community/posts/:postId/comments
Tambah komentar atau reply.

**Body:**
```json
{
  "content": "Isi komentar (1-1000 karakter)",
  "parent_id": "uuid" // optional, untuk reply
}
```

#### DELETE /api/community/posts/:postId/comments/:commentId
Hapus komentar (author atau admin).

#### POST /api/community/posts/:postId/like
Toggle like postingan.

**Response:**
```json
{
  "liked": true|false
}
```

#### POST /api/community/posts/:postId/bookmark
Toggle bookmark postingan.

**Response:**
```json
{
  "bookmarked": true|false
}
```

#### GET /api/community/bookmarks
List postingan yang di-bookmark user.

**Response:**
```json
{
  "posts": [ /* ... */ ]
}
```

## Frontend Integration

### Panel Admin

Akses melalui: **Admin Panel → Komunitas**

Fitur:
- Buat postingan sebagai admin (dengan centang biru)
- Filter: Semua / Admin / Peserta
- Pencarian postingan
- Hapus postingan (semua postingan)
- Lihat statistik like dan komentar

### Halaman Public

Akses melalui: **Navbar → Komunitas** atau **Dashboard → Komunitas**

Fitur:
- Upload: Form untuk buat postingan
- Explore: Jelajahi semua postingan
- Markah: Postingan yang di-bookmark
- Trending: Filter berdasarkan tag populer
- Pencarian: Cari postingan
- Like, komentar, bookmark

### Authentication Flow

**Peserta:**
- Menggunakan `X-Participant-Token` header
- Token didapat dari proses onboarding (`/api/participants`)
- Token disimpan di localStorage

**Admin:**
- Menggunakan `Authorization: Bearer <token>` header
- Token didapat dari login admin (`/api/admin/auth/login`)
- Token disimpan di memory (module api.js)

## Kategori/Tag Postingan

1. **Umum** - Default, postingan umum
2. **Curhat Korban** - Cerita pengalaman korban
3. **Modus Baru** - Info modus penipuan terbaru
4. **Tips Aman** - Tips keamanan digital
5. **Edukasi** - Konten edukatif
6. **Pinjol Ilegal** - Info pinjaman online ilegal
7. **APK Palsu** - Peringatan aplikasi palsu
8. **Phishing & OTP** - Info tentang phishing dan OTP
9. **Investasi Bodong** - Peringatan investasi bodong
10. **Penipuan Online Shop** - Modus penipuan belanja online

## Security & Privacy

### Input Validation
- Content max 2000 karakter (posts)
- Content max 1000 karakter (comments)
- Tag harus dari daftar yang valid
- Sanitasi input untuk mencegah XSS

### Authorization
- User hanya bisa edit/hapus postingan sendiri
- Admin bisa hapus semua postingan
- Like/bookmark butuh authentication
- Public bisa baca tanpa login

### Rate Limiting
- Rate limit sesuai global limiter backend
- Validasi di controller untuk mencegah spam

## Development

### Testing API dengan curl

**Public - List Posts:**
```bash
curl http://localhost:3000/api/community/posts
```

**Participant - Create Post:**
```bash
curl -X POST http://localhost:3000/api/community/posts \
  -H "Content-Type: application/json" \
  -H "X-Participant-Token: YOUR_TOKEN" \
  -d '{
    "content": "Test posting dari peserta",
    "tag": "Tips Aman"
  }'
```

**Admin - Create Post:**
```bash
curl -X POST http://localhost:3000/api/community/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "content": "Pengumuman penting dari admin",
    "tag": "Edukasi"
  }'
```

**Like Post:**
```bash
curl -X POST http://localhost:3000/api/community/posts/POST_ID/like \
  -H "X-Participant-Token: YOUR_TOKEN"
```

**Bookmark Post:**
```bash
curl -X POST http://localhost:3000/api/community/posts/POST_ID/bookmark \
  -H "X-Participant-Token: YOUR_TOKEN"
```

## Deployment Checklist

- [ ] Run database migration
- [ ] Verify tabel komunitas sudah dibuat
- [ ] Test API endpoints
- [ ] Test admin panel komunitas
- [ ] Test public komunitas page
- [ ] Verify authentication flow
- [ ] Test like/bookmark functionality
- [ ] Monitor performance dengan banyak posts

## Future Enhancements

Potensial fitur tambahan:
- 📷 Upload gambar langsung (sekarang hanya URL)
- 🔔 Notifikasi untuk reply/like
- 📊 Analytics untuk admin (trending topics)
- 🚩 Report system untuk konten tidak pantas
- 👥 Mention/tag user di komentar
- 🔥 Trending posts algorithm
- 📌 Pin posts (admin only)
- 🎖️ User reputation system

## Troubleshooting

### Migration gagal
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"

# Run migration manually
psql $DATABASE_URL < Backend/src/db/migrations/010_community_posts.sql
```

### Posts tidak muncul
- Cek API response di Network tab browser
- Verify token participant valid
- Cek backend logs untuk error

### Like/Bookmark tidak berfungsi
- Pastikan participant token tersedia
- Cek localStorage: `tangkistipu.peserta`
- Verify authentication middleware berfungsi

## Contact

Untuk pertanyaan atau issue terkait fitur komunitas, silakan buat issue di repository atau hubungi tim development.
