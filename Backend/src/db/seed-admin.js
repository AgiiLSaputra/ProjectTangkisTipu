// seed-admin.js — buat / perbarui satu akun admin untuk panel admin.
//
// Pakai:
//   node src/db/seed-admin.js <username> <password> [role]
//
// Contoh:
//   node src/db/seed-admin.js admin SuperSecret123 superadmin
//
// Idempoten: bila username sudah ada, password & role diperbarui,
// dan akun dipastikan aktif (active = true).
import { query, pool } from '../config/db.js';
import { hashPassword } from '../services/adminAuthService.js';

const [username, password, role = 'admin'] = process.argv.slice(2);

if (!username || !password) {
  console.error('Pakai: node src/db/seed-admin.js <username> <password> [role]');
  process.exit(1);
}
if (!['admin', 'superadmin'].includes(role)) {
  console.error('Role harus "admin" atau "superadmin".');
  process.exit(1);
}

async function main() {
  const passwordHash = hashPassword(password);
  const { rows } = await query(
    `INSERT INTO admin_users (username, password_hash, role, active, updated_at)
     VALUES ($1, $2, $3, TRUE, NOW())
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash,
                   role = EXCLUDED.role,
                   active = TRUE,
                   updated_at = NOW()
     RETURNING username, role, active`,
    [username, passwordHash, role],
  );
  const admin = rows[0];
  console.log(`[seed-admin] Siap: ${admin.username} (${admin.role}, active=${admin.active})`);
}

main()
  .catch((err) => {
    console.error('[seed-admin] Gagal:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
