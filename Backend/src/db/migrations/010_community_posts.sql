-- 010_community_posts.sql — Komunitas posts & comments
-- Sistem komunitas untuk berbagi cerita dan edukasi anti-penipuan

-- Tabel utama posts komunitas
CREATE TABLE IF NOT EXISTS community_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL, -- bisa participant atau admin
  author_type     TEXT NOT NULL CHECK (author_type IN ('participant', 'admin')),
  author_name     TEXT NOT NULL,
  author_handle   TEXT NOT NULL,
  tag             TEXT NOT NULL DEFAULT 'Umum',
  content         TEXT NOT NULL,
  image_url       TEXT,
  likes_count     INT NOT NULL DEFAULT 0,
  comments_count  INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id, author_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_tag ON community_posts(tag);

-- Tabel komentar posts
CREATE TABLE IF NOT EXISTS community_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL,
  author_type     TEXT NOT NULL CHECK (author_type IN ('participant', 'admin')),
  author_name     TEXT NOT NULL,
  author_handle   TEXT NOT NULL,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_comments(parent_id);

-- Tabel likes (untuk track siapa yang like apa)
CREATE TABLE IF NOT EXISTS community_likes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  user_type       TEXT NOT NULL CHECK (user_type IN ('participant', 'admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id, user_type)
);

CREATE INDEX IF NOT EXISTS idx_community_likes_post ON community_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_user ON community_likes(user_id, user_type);

-- Tabel bookmarks
CREATE TABLE IF NOT EXISTS community_bookmarks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  user_type       TEXT NOT NULL CHECK (user_type IN ('participant', 'admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id, user_type)
);

CREATE INDEX IF NOT EXISTS idx_community_bookmarks_post ON community_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_user ON community_bookmarks(user_id, user_type);
