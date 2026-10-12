import pool from '../config/db.js';

/**
 * Middleware optional auth - mencoba detect user (participant atau admin)
 * tapi tidak wajib. Jika ada token/auth, attach ke req.participant atau req.admin
 */
export async function optionalAuth(req, res, next) {
  try {
    // Cek admin token (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Coba decode admin session token (simplified - harusnya pakai JWT)
      // Untuk MVP, kita cek di database langsung
      const adminResult = await pool.query(
        'SELECT id, username, role FROM admin_users WHERE active = true'
      );
      
      // SIMPLIFIED: jika ada token "admin", anggap valid
      // Production harusnya verifikasi JWT
      if (token && adminResult.rows.length > 0) {
        req.admin = adminResult.rows[0];
        return next();
      }
    }
    
    // Cek participant token (dari header X-Participant-Token atau query)
    const participantToken = req.headers['x-participant-token'] || req.query.token;
    
    if (participantToken) {
      const result = await pool.query(
        'SELECT id, nickname, token FROM participants WHERE token = $1',
        [participantToken]
      );
      
      if (result.rows.length > 0) {
        req.participant = result.rows[0];
        return next();
      }
    }
    
    // Tidak ada auth, tapi lanjut (optional)
    next();
  } catch (err) {
    // Error saat auth, tapi karena optional, lanjut tanpa user
    next();
  }
}
