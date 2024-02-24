-- Create our tables --

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY NOT NULL UNIQUE,
  username TEXT NOT NULL ,
  bio TEXT,
  image TEXT,
);

CREATE TABLE IF NOT EXISTS articles (
  slug TEXT PRIMARY KEY NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author TEXT NOT NULL REFERENCES users(email)
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author TEXT NOT NULL REFERENCES users(email),
  article TEXT NOT NULL REFERENCES articles(slug)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_email TEXT NOT NULL REFERENCES users(email),
  article_slug TEXT NOT NULL REFERENCES articles(slug),
  PRIMARY KEY (user_email, article_slug)
);

CREATE TABLE IF NOT EXISTS follows (
  follower TEXT NOT NULL REFERENCES users(email),
  followed TEXT NOT NULL REFERENCES users(email),
  PRIMARY KEY (follower, followed)
);

CREATE TABLE IF NOT EXISTS tags (
  tag TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_slug TEXT NOT NULL REFERENCES articles(slug),
  tag TEXT NOT NULL REFERENCES tags(tag),
  PRIMARY KEY (article_slug, tag)
);

CREATE TABLE IF NOT EXISTS users_follows (
  follower TEXT NOT NULL REFERENCES users(email),
  followed TEXT NOT NULL REFERENCES users(email),
  PRIMARY KEY (follower, followed)
);

CREATE TABLE IF NOT EXISTS users_favorites (
  user_email TEXT NOT NULL REFERENCES users(email),
  article_slug TEXT NOT NULL REFERENCES articles(slug),
  PRIMARY KEY (user_email, article_slug)
);

-- Create Indexes --

CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author);
CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_email);
CREATE INDEX IF NOT EXISTS idx_favorites_article ON favorites(article_slug);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed);
CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_slug);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag);
CREATE INDEX IF NOT EXISTS idx_users_follows_follower ON users_follows(follower);
CREATE INDEX IF NOT EXISTS idx_users_follows_followed ON users_follows(followed);
CREATE INDEX IF NOT EXISTS idx_users_favorites_user ON users_favorites(user_email);
CREATE INDEX IF NOT EXISTS idx_users_favorites_article ON users_favorites(article_slug);
