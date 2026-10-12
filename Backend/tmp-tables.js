import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });
try {
  const r = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
  const names = r.rows.map(x => x.table_name);
  console.log('TABEL PUBLIC (' + names.length + '):');
  console.log(names.join(', '));
  console.log('\ncommunity_posts ADA?', names.includes('community_posts') ? 'YA' : 'TIDAK');
  console.log('admin_users ADA?', names.includes('admin_users') ? 'YA' : 'TIDAK');
} catch (e) {
  console.log('ERR:', e.message);
} finally { await pool.end(); }
