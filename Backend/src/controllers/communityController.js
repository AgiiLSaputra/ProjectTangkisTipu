import pool from '../config/db.js';
import Joi from 'joi';

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

export const createPostSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  tag: Joi.string().trim().max(50).default('Umum'),
  image_url: Joi.string().trim().uri().allow(null).optional(),
});

export const updatePostSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).optional(),
  tag: Joi.string().trim().max(50).optional(),
});

export const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
  parent_id: Joi.string().uuid().allow(null).optional(),
});

export const listPostsQuerySchema = Joi.object({
  tag: Joi.string().trim().max(50).optional(),
  search: Joi.string().trim().max(200).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

export const postIdParamSchema = Joi.object({
  postId: Joi.string().uuid().required(),
});

export const commentIdParamSchema = Joi.object({
  commentId: Joi.string().uuid().required(),
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getUserFromRequest(req) {
  // Cek apakah user adalah admin
  if (req.admin) {
    return {
      id: req.admin.id,
      type: 'admin',
      name: req.admin.username || 'Admin',
      handle: `@${req.admin.username || 'admin'}`,
      verified: true,
    };
  }
  
  // Cek apakah user adalah participant
  if (req.participant) {
    return {
      id: req.participant.id,
      type: 'participant',
      name: req.participant.nickname || 'Peserta',
      handle: `@${req.participant.nickname?.toLowerCase().replace(/\s+/g, '') || 'peserta'}`,
      verified: false,
    };
  }
  
  return null;
}

// ============================================================
// CONTROLLERS - POSTS
// ============================================================

/**
 * GET /api/community/posts
 * List semua posts dengan filter & pagination
 */
export async function listPosts(req, res, next) {
  try {
    const { tag, search, limit, offset } = req.query;
    const user = getUserFromRequest(req);
    
    let query = `
      SELECT 
        p.*,
        ${user ? `
          EXISTS(SELECT 1 FROM community_likes WHERE post_id = p.id AND user_id = $1 AND user_type = $2) as user_liked,
          EXISTS(SELECT 1 FROM community_bookmarks WHERE post_id = p.id AND user_id = $1 AND user_type = $2) as user_bookmarked
        ` : 'false as user_liked, false as user_bookmarked'}
      FROM community_posts p
      WHERE 1=1
    `;
    
    const params = user ? [user.id, user.type] : [];
    let paramIndex = params.length + 1;
    
    if (tag) {
      query += ` AND p.tag = $${paramIndex}`;
      params.push(tag);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (p.content ILIKE $${paramIndex} OR p.author_name ILIKE $${paramIndex} OR p.tag ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Format response
    const posts = result.rows.map(row => ({
      id: row.id,
      author: {
        id: row.author_id,
        type: row.author_type,
        name: row.author_name,
        handle: row.author_handle,
        verified: row.author_type === 'admin',
      },
      tag: row.tag,
      content: row.content,
      image_url: row.image_url,
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      user_liked: row.user_liked || false,
      user_bookmarked: row.user_bookmarked || false,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/community/posts
 * Buat post baru (butuh auth)
 */
export async function createPost(req, res, next) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { content, tag, image_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO community_posts 
       (author_id, author_type, author_name, author_handle, content, tag, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user.id, user.type, user.name, user.handle, content, tag || 'Umum', image_url || null]
    );
    
    const post = result.rows[0];
    
    res.status(201).json({
      post: {
        id: post.id,
        author: {
          id: post.author_id,
          type: post.author_type,
          name: post.author_name,
          handle: post.author_handle,
          verified: post.author_type === 'admin',
        },
        tag: post.tag,
        content: post.content,
        image_url: post.image_url,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        user_liked: false,
        user_bookmarked: false,
        created_at: post.created_at,
        updated_at: post.updated_at,
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/community/posts/:postId
 * Detail satu post beserta comments
 */
export async function getPost(req, res, next) {
  try {
    const { postId } = req.params;
    const user = getUserFromRequest(req);
    
    const postResult = await pool.query(
      `SELECT 
        p.*,
        ${user ? `
          EXISTS(SELECT 1 FROM community_likes WHERE post_id = p.id AND user_id = $2 AND user_type = $3) as user_liked,
          EXISTS(SELECT 1 FROM community_bookmarks WHERE post_id = p.id AND user_id = $2 AND user_type = $3) as user_bookmarked
        ` : 'false as user_liked, false as user_bookmarked'}
       FROM community_posts p
       WHERE p.id = $1`,
      user ? [postId, user.id, user.type] : [postId]
    );
    
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = postResult.rows[0];
    
    // Get comments (hanya parent comments, replies akan nested)
    const commentsResult = await pool.query(
      `SELECT * FROM community_comments
       WHERE post_id = $1 AND parent_id IS NULL
       ORDER BY created_at ASC`,
      [postId]
    );
    
    // Get replies untuk setiap comment
    const comments = await Promise.all(
      commentsResult.rows.map(async (comment) => {
        const repliesResult = await pool.query(
          `SELECT * FROM community_comments
           WHERE parent_id = $1
           ORDER BY created_at ASC`,
          [comment.id]
        );
        
        return {
          id: comment.id,
          author: {
            id: comment.author_id,
            type: comment.author_type,
            name: comment.author_name,
            handle: comment.author_handle,
            verified: comment.author_type === 'admin',
          },
          content: comment.content,
          created_at: comment.created_at,
          replies: repliesResult.rows.map(r => ({
            id: r.id,
            author: {
              id: r.author_id,
              type: r.author_type,
              name: r.author_name,
              handle: r.author_handle,
              verified: r.author_type === 'admin',
            },
            content: r.content,
            created_at: r.created_at,
          })),
        };
      })
    );
    
    res.json({
      post: {
        id: post.id,
        author: {
          id: post.author_id,
          type: post.author_type,
          name: post.author_name,
          handle: post.author_handle,
          verified: post.author_type === 'admin',
        },
        tag: post.tag,
        content: post.content,
        image_url: post.image_url,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        user_liked: post.user_liked || false,
        user_bookmarked: post.user_bookmarked || false,
        created_at: post.created_at,
        updated_at: post.updated_at,
      },
      comments,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/community/posts/:postId
 * Update post (hanya author)
 */
export async function updatePost(req, res, next) {
  try {
    const { postId } = req.params;
    const user = getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek ownership
    const checkResult = await pool.query(
      'SELECT * FROM community_posts WHERE id = $1',
      [postId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = checkResult.rows[0];
    
    if (post.author_id !== user.id || post.author_type !== user.type) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { content, tag } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      values.push(content);
      paramIndex++;
    }
    
    if (tag !== undefined) {
      updates.push(`tag = $${paramIndex}`);
      values.push(tag);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(postId);
    
    const result = await pool.query(
      `UPDATE community_posts SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    const updated = result.rows[0];
    
    res.json({
      post: {
        id: updated.id,
        author: {
          id: updated.author_id,
          type: updated.author_type,
          name: updated.author_name,
          handle: updated.author_handle,
          verified: updated.author_type === 'admin',
        },
        tag: updated.tag,
        content: updated.content,
        image_url: updated.image_url,
        likes_count: updated.likes_count,
        comments_count: updated.comments_count,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/community/posts/:postId
 * Hapus post (hanya author atau admin)
 */
export async function deletePost(req, res, next) {
  try {
    const { postId } = req.params;
    const user = getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek ownership
    const checkResult = await pool.query(
      'SELECT * FROM community_posts WHERE id = $1',
      [postId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = checkResult.rows[0];
    
    // Admin bisa hapus semua, user hanya bisa hapus miliknya
    const canDelete = (post.author_id === user.id && post.author_type === user.type) || user.type === 'admin';
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await pool.query('DELETE FROM community_posts WHERE id = $1', [postId]);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// ============================================================
// CONTROLLERS - COMMENTS
// ============================================================

/**
 * POST /api/community/posts/:postId/comments
 * Tambah comment atau reply
 */
export async function createComment(req, res, next) {
  try {
    const { postId } = req.params;
    const { content, parent_id } = req.body;
    const user = getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek post exists
    const postCheck = await pool.query(
      'SELECT id FROM community_posts WHERE id = $1',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Jika parent_id ada, cek parent comment exists
    if (parent_id) {
      const parentCheck = await pool.query(
        'SELECT id FROM community_comments WHERE id = $1 AND post_id = $2',
        [parent_id, postId]
      );
      
      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert comment
      const commentResult = await client.query(
        `INSERT INTO community_comments 
         (post_id, parent_id, author_id, author_type, author_name, author_handle, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [postId, parent_id || null, user.id, user.type, user.name, user.handle, content]
      );
      
      // Update comments count di post
      await client.query(
        'UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = $1',
        [postId]
      );
      
      await client.query('COMMIT');
      
      const comment = commentResult.rows[0];
      
      res.status(201).json({
        comment: {
          id: comment.id,
          author: {
            id: comment.author_id,
            type: comment.author_type,
            name: comment.author_name,
            handle: comment.author_handle,
            verified: comment.author_type === 'admin',
          },
          content: comment.content,
          created_at: comment.created_at,
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/community/posts/:postId/comments/:commentId
 * Hapus comment (author atau admin)
 */
export async function deleteComment(req, res, next) {
  try {
    const { postId, commentId } = req.params;
    const user = getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek comment exists
    const checkResult = await pool.query(
      'SELECT * FROM community_comments WHERE id = $1 AND post_id = $2',
      [commentId, postId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const comment = checkResult.rows[0];
    
    // Admin bisa hapus semua, user hanya bisa hapus miliknya
    const canDelete = (comment.author_id === user.id && comment.author_type === user.type) || user.type === 'admin';
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Hitung jumlah comment + replies yang akan dihapus
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM community_comments 
         WHERE id = $1 OR parent_id = $1`,
        [commentId]
      );
      
      const deleteCount = parseInt(countResult.rows[0].count);
      
      // Delete comment (replies akan cascade)
      await client.query('DELETE FROM community_comments WHERE id = $1', [commentId]);
      
      // Update comments count
      await client.query(
        'UPDATE community_posts SET comments_count = comments_count - $1 WHERE id = $2',
        [deleteCount, postId]
      );
      
      await client.query('COMMIT');
      
      res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

// ============================================================
// CONTROLLERS - LIKES & BOOKMARKS
// ============================================================

/**
 * POST /api/community/posts/:postId/like
 * Toggle like
 */
export async function toggleLike(req, res, next) {
  try {
    const { postId } = req.params;
    const user = getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek post exists
    const postCheck = await pool.query(
      'SELECT id FROM community_posts WHERE id = $1',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Cek apakah sudah like
      const likeCheck = await client.query(
        'SELECT id FROM community_likes WHERE post_id = $1 AND user_id = $2 AND user_type = $3',
        [postId, user.id, user.type]
      );
      
      let liked = false;
      
      if (likeCheck.rows.length > 0) {
        // Unlike
        await client.query(
          'DELETE FROM community_likes WHERE post_id = $1 AND user_id = $2 AND user_type = $3',
          [postId, user.id, user.type]
        );
        await client.query(
          'UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = $1',
          [postId]
        );
        liked = false;
      } else {
        // Like
        await client.query(
          'INSERT INTO community_likes (post_id, user_id, user_type) VALUES ($1, $2, $3)',
          [postId, user.id, user.type]
        );
        await client.query(
          'UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = $1',
          [postId]
        );
        liked = true;
      }
      
      await client.query('COMMIT');
      
      res.json({ liked });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/community/posts/:postId/bookmark
 * Toggle bookmark
 */
export async function toggleBookmark(req, res, next) {
  try {
    const { postId } = req.params;
    const user = getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Cek post exists
    const postCheck = await pool.query(
      'SELECT id FROM community_posts WHERE id = $1',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Cek apakah sudah bookmark
    const bookmarkCheck = await pool.query(
      'SELECT id FROM community_bookmarks WHERE post_id = $1 AND user_id = $2 AND user_type = $3',
      [postId, user.id, user.type]
    );
    
    let bookmarked = false;
    
    if (bookmarkCheck.rows.length > 0) {
      // Remove bookmark
      await pool.query(
        'DELETE FROM community_bookmarks WHERE post_id = $1 AND user_id = $2 AND user_type = $3',
        [postId, user.id, user.type]
      );
      bookmarked = false;
    } else {
      // Add bookmark
      await pool.query(
        'INSERT INTO community_bookmarks (post_id, user_id, user_type) VALUES ($1, $2, $3)',
        [postId, user.id, user.type]
      );
      bookmarked = true;
    }
    
    res.json({ bookmarked });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/community/bookmarks
 * Get user's bookmarked posts
 */
export async function getBookmarks(req, res, next) {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const result = await pool.query(
      `SELECT 
        p.*,
        true as user_bookmarked,
        EXISTS(SELECT 1 FROM community_likes WHERE post_id = p.id AND user_id = $1 AND user_type = $2) as user_liked
       FROM community_posts p
       INNER JOIN community_bookmarks b ON b.post_id = p.id
       WHERE b.user_id = $1 AND b.user_type = $2
       ORDER BY b.created_at DESC`,
      [user.id, user.type]
    );
    
    const posts = result.rows.map(row => ({
      id: row.id,
      author: {
        id: row.author_id,
        type: row.author_type,
        name: row.author_name,
        handle: row.author_handle,
        verified: row.author_type === 'admin',
      },
      tag: row.tag,
      content: row.content,
      image_url: row.image_url,
      likes_count: row.likes_count,
      comments_count: row.comments_count,
      user_liked: row.user_liked || false,
      user_bookmarked: true,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
    
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}
