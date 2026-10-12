#!/usr/bin/env node

/**
 * Test Script untuk Fitur Komunitas
 * Jalankan: node Backend/test-community.js
 */

import { pool } from './src/config/db.js';

const TESTS = {
  passed: 0,
  failed: 0,
  errors: [],
};

function pass(name) {
  TESTS.passed++;
  console.log(`✅ ${name}`);
}

function fail(name, error) {
  TESTS.failed++;
  TESTS.errors.push({ name, error });
  console.log(`❌ ${name}: ${error}`);
}

async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    if (result.rows.length > 0) {
      pass('Database connection');
    } else {
      fail('Database connection', 'No result returned');
    }
  } catch (err) {
    fail('Database connection', err.message);
  }
}

async function testTablesExist() {
  const tables = [
    'community_posts',
    'community_comments',
    'community_likes',
    'community_bookmarks',
  ];

  for (const table of tables) {
    try {
      const result = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      if (result.rows[0].exists) {
        pass(`Table ${table} exists`);
      } else {
        fail(`Table ${table} exists`, 'Table not found');
      }
    } catch (err) {
      fail(`Table ${table} exists`, err.message);
    }
  }
}

async function testTableStructure() {
  try {
    // Test community_posts columns
    const postsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'community_posts'
    `);
    
    const requiredPostsColumns = [
      'id', 'author_id', 'author_type', 'author_name', 'author_handle',
      'tag', 'content', 'image_url', 'likes_count', 'comments_count',
      'created_at', 'updated_at'
    ];
    
    const existingColumns = postsColumns.rows.map(r => r.column_name);
    const missingColumns = requiredPostsColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      pass('community_posts structure');
    } else {
      fail('community_posts structure', `Missing columns: ${missingColumns.join(', ')}`);
    }
  } catch (err) {
    fail('community_posts structure', err.message);
  }
}

async function testIndexes() {
  try {
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename LIKE 'community_%'
    `);
    
    if (indexes.rows.length > 0) {
      pass(`Indexes created (${indexes.rows.length} indexes)`);
    } else {
      fail('Indexes created', 'No indexes found');
    }
  } catch (err) {
    fail('Indexes created', err.message);
  }
}

async function testInsertPost() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(`
      INSERT INTO community_posts 
      (author_id, author_type, author_name, author_handle, content, tag)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      '00000000-0000-0000-0000-000000000001',
      'admin',
      'Test Admin',
      '@testadmin',
      'Test post untuk verifikasi database',
      'Edukasi'
    ]);
    
    if (result.rows.length > 0) {
      pass('Insert test post');
      
      // Test select
      const selectResult = await client.query(
        'SELECT * FROM community_posts WHERE id = $1',
        [result.rows[0].id]
      );
      
      if (selectResult.rows.length > 0) {
        pass('Select test post');
      } else {
        fail('Select test post', 'Post not found after insert');
      }
    } else {
      fail('Insert test post', 'No ID returned');
    }
    
    await client.query('ROLLBACK'); // Rollback test data
  } catch (err) {
    await client.query('ROLLBACK');
    fail('Insert test post', err.message);
  } finally {
    client.release();
  }
}

async function testConstraints() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Test unique constraint on likes
    const postId = '00000000-0000-0000-0000-000000000001';
    const userId = '00000000-0000-0000-0000-000000000002';
    
    // Insert post first
    await client.query(`
      INSERT INTO community_posts 
      (id, author_id, author_type, author_name, author_handle, content, tag)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [postId, userId, 'participant', 'Test', '@test', 'Test', 'Umum']);
    
    // First like should succeed
    await client.query(
      'INSERT INTO community_likes (post_id, user_id, user_type) VALUES ($1, $2, $3)',
      [postId, userId, 'participant']
    );
    
    // Second like should fail (unique constraint)
    try {
      await client.query(
        'INSERT INTO community_likes (post_id, user_id, user_type) VALUES ($1, $2, $3)',
        [postId, userId, 'participant']
      );
      fail('Unique constraint on likes', 'Duplicate like was allowed');
    } catch (err) {
      if (err.code === '23505') { // Unique violation
        pass('Unique constraint on likes');
      } else {
        fail('Unique constraint on likes', err.message);
      }
    }
    
    await client.query('ROLLBACK');
  } catch (err) {
    await client.query('ROLLBACK');
    fail('Unique constraint on likes', err.message);
  } finally {
    client.release();
  }
}

async function testCascadeDelete() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create post
    const postResult = await client.query(`
      INSERT INTO community_posts 
      (author_id, author_type, author_name, author_handle, content, tag)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, ['00000000-0000-0000-0000-000000000003', 'admin', 'Test', '@test', 'Test', 'Umum']);
    
    const postId = postResult.rows[0].id;
    
    // Create comment
    await client.query(`
      INSERT INTO community_comments 
      (post_id, author_id, author_type, author_name, author_handle, content)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [postId, '00000000-0000-0000-0000-000000000003', 'admin', 'Test', '@test', 'Comment']);
    
    // Create like
    await client.query(
      'INSERT INTO community_likes (post_id, user_id, user_type) VALUES ($1, $2, $3)',
      [postId, '00000000-0000-0000-0000-000000000003', 'admin']
    );
    
    // Delete post
    await client.query('DELETE FROM community_posts WHERE id = $1', [postId]);
    
    // Check comments and likes are deleted
    const commentsResult = await client.query(
      'SELECT COUNT(*) FROM community_comments WHERE post_id = $1',
      [postId]
    );
    
    const likesResult = await client.query(
      'SELECT COUNT(*) FROM community_likes WHERE post_id = $1',
      [postId]
    );
    
    if (commentsResult.rows[0].count === '0' && likesResult.rows[0].count === '0') {
      pass('Cascade delete on post removal');
    } else {
      fail('Cascade delete on post removal', 'Comments or likes not deleted');
    }
    
    await client.query('ROLLBACK');
  } catch (err) {
    await client.query('ROLLBACK');
    fail('Cascade delete on post removal', err.message);
  } finally {
    client.release();
  }
}

async function runTests() {
  console.log('🧪 Testing Fitur Komunitas Database\n');
  
  await testDatabaseConnection();
  await testTablesExist();
  await testTableStructure();
  await testIndexes();
  await testInsertPost();
  await testConstraints();
  await testCascadeDelete();
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${TESTS.passed}`);
  console.log(`❌ Failed: ${TESTS.failed}`);
  
  if (TESTS.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    TESTS.errors.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }
  
  console.log('='.repeat(50));
  
  await pool.end();
  
  process.exit(TESTS.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('❌ Test script error:', err);
  pool.end();
  process.exit(1);
});
