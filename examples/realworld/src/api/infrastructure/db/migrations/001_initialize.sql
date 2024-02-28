-- Create reusable functions --
-- This function sets the updated_at column to the current time when a row is updated.
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER
  AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- This function creates a trigger that sets the updated_at column to the current time when a row is updated.
CREATE OR REPLACE FUNCTION trigger_updated_at(tablename regclass)
  RETURNS void
  AS $$
BEGIN
  EXECUTE format('CREATE TRIGGER set_updated_at
        BEFORE UPDATE
        ON %s
        FOR EACH ROW
        WHEN (OLD is distinct from NEW)
    EXECUTE FUNCTION set_updated_at();', tablename);
END;
$$
LANGUAGE plpgsql;

-- This function sets the deleted column to true and updates the updated_at column to the current time when a row is deleted.
CREATE OR REPLACE FUNCTION set_soft_delete()
  RETURNS TRIGGER
  AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    OLD.deleted = TRUE;
    OLD.updated_at = now();
    RETURN OLD;
  END IF;
END;
$$
LANGUAGE plpgsql;

-- This function creates a trigger that sets the deleted column to true and updates the updated_at column to the current time when a row is deleted.
CREATE OR REPLACE FUNCTION trigger_soft_delete(tablename regclass)
  RETURNS void
  AS $$
BEGIN
  EXECUTE format('CREATE TRIGGER set_soft_delete
        INSTEAD OF DELETE
        ON %s
        FOR EACH ROW
    EXECUTE FUNCTION set_soft_delete();', tablename);
END;
$$
LANGUAGE plpgsql;

-- Create our tables --
-- This table stores user information.
CREATE TABLE IF NOT EXISTS users(
  email text PRIMARY KEY NOT NULL UNIQUE,
  username text NOT NULL,
  password TEXT NOT NULL,
  bio text,
  image text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE,
);

SELECT
  trigger_updated_at(users);

SELECT
  trigger_soft_delete(users);

-- This table stores article information.
CREATE TABLE IF NOT EXISTS articles(
  slug text PRIMARY KEY NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  body text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author text NOT NULL REFERENCES users(email),
  deleted boolean NOT NULL DEFAULT FALSE,
);

SELECT
  trigger_updated_at(articles);

SELECT
  trigger_soft_delete(articles);

-- This table stores comment information.
CREATE TABLE IF NOT EXISTS comments(
  id serial PRIMARY KEY,
  body text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author text NOT NULL REFERENCES users(email),
  article text NOT NULL REFERENCES articles(slug),
  deleted boolean NOT NULL DEFAULT FALSE,
);

SELECT
  trigger_updated_at(comments);

SELECT
  trigger_soft_delete(comments);

-- This table stores favorite information.
CREATE TABLE IF NOT EXISTS favorites(
  user_email text NOT NULL REFERENCES users(email),
  article_slug text NOT NULL REFERENCES articles(slug),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_email, article_slug)
);

SELECT
  trigger_soft_delete(favorites);

-- This table stores follow information.
CREATE TABLE IF NOT EXISTS follows(
  follower text NOT NULL REFERENCES users(email),
  followed text NOT NULL REFERENCES users(email),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (follower, followed)
);

SELECT
  trigger_soft_delete(follows);

-- This table stores tag information.
CREATE TABLE IF NOT EXISTS tags(
  tag text PRIMARY KEY NOT NULL UNIQUE,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE
);

SELECT
  trigger_soft_delete(tags);

-- This table stores article tag information.
CREATE TABLE IF NOT EXISTS article_tags(
  article_slug text NOT NULL REFERENCES articles(slug),
  tag text NOT NULL REFERENCES tags(tag),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (article_slug, tag)
);

SELECT
  trigger_soft_delete(article_tags);

-- This table stores JWT information.
CREATE TABLE IF NOT EXISTS jwts(
  user_email text NOT NULL REFERENCES users(email),
  jwt text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamp NOT NULL,
  revoked boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (email, jwt)
);

SELECT
  trigger_soft_delete(jwts);

-- Create Indexes --
-- This index is used to quickly find a user by their email.
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username, deleted);

-- This index is used to quickly find an article by its slug.
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author, deleted);

-- This index is used to quickly find a comment by its author.
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author, deleted);

-- This index is used to quickly find a comment by its article.
CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article, deleted);

-- This index is used to quickly find a favorite by its user.
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_email, deleted);

-- This index is used to quickly find a favorite by its article.
CREATE INDEX IF NOT EXISTS idx_favorites_article ON favorites(user_email, article_slug, deleted);

-- This index is used to quickly find a follow by its follower.
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower, deleted);

-- This index is used to quickly find a follow by its followed.
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed, deleted);

-- This index is used to quickly find an article by its tags.
CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_slug, deleted);

-- This index is used to quickly find a tag by its articles.
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag, deleted);

-- This index is used to quickly find a non-expired JWT by its token
CREATE INDEX IF NOT EXISTS idx_jwts_jwt ON jwts(jwt, expires_at, revoked);

-- This index is used to quickly find a non-expired JWT by its user
CREATE INDEX IF NOT EXISTS idx_jwts_email ON jwts(user_email, expires_at, revoked);

-- This index is used to quickly find a tag by its name
CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag, deleted);

