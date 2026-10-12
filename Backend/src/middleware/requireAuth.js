import pool from '../config/db.js';

/**
 * Middleware require auth - wajib punya user (participant atau admin)
 */
export async function requireAuth(req, res, next) {
  try {
    // Cek admin token (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // SIMPLIFIED: untuk MVP
      // Production harusnya verifikasi JWT proper
      const adminResult = await pool.query(
        'SELECT id, username, role FROM admin_users WHERE active = true'
      );
      
      if (token && adminResult.rows.length > 0) {
        req.admin = adminResult.rows[0];
        return next();
      }
    }
    
    // Cek participant token
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
    
    // Tidak ada auth yang valid
    return res.status(401).json({ error: 'Authentication required' });
  } catch (err) {
    return res.status(500).json({ error: 'Authentication error' });
  }
}
