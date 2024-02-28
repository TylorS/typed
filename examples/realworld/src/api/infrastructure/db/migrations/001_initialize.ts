import * as Pg from "@sqlfx/pg"
import * as Effect from "effect/Effect"

export default Effect.flatMap(
  Pg.tag,
  (sql) =>
    Effect.gen(function*(_) {
      yield* _(sql`CREATE TABLE IF NOT EXISTS users(
  email TEXT PRIMARY KEY NOT NULL UNIQUE,
  username text NOT NULL,
  password TEXT NOT NULL,
  bio text,
  image text,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE
);`)

      yield* _(sql`CREATE TABLE IF NOT EXISTS articles(
  slug text PRIMARY KEY NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  body text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author text NOT NULL REFERENCES users(email),
  deleted boolean NOT NULL DEFAULT FALSE
);`)

      yield* _(sql`CREATE TABLE IF NOT EXISTS comments(
  id serial PRIMARY KEY,
  body text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  author text NOT NULL REFERENCES users(email),
  article text NOT NULL REFERENCES articles(slug),
  deleted boolean NOT NULL DEFAULT FALSE
);`)

      yield* _(sql`CREATE TABLE IF NOT EXISTS favorites(
  user_email text NOT NULL REFERENCES users(email),
  article_slug text NOT NULL REFERENCES articles(slug),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_email, article_slug)
);
`)

      yield* _(sql`CREATE TABLE IF NOT EXISTS follows(
  follower text NOT NULL REFERENCES users(email),
  followed text NOT NULL REFERENCES users(email),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (follower, followed)
);
`)

      yield* _(sql`
CREATE TABLE IF NOT EXISTS tags(
  tag text PRIMARY KEY NOT NULL UNIQUE,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE
);`)

      yield* _(sql`CREATE TABLE IF NOT EXISTS article_tags(
  article_slug text NOT NULL REFERENCES articles(slug),
  tag text NOT NULL REFERENCES tags(tag),
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (article_slug, tag)
);`)

      yield* _(sql`CREATE TABLE IF NOT EXISTS jwts(
  user_email text NOT NULL REFERENCES users(email),
  jwt text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamp NOT NULL,
  revoked boolean NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_email, jwt)
);`)

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username, deleted);`)

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author, deleted);`)

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author, deleted);`)

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_comments_article ON comments(article, deleted);`)

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_email, deleted);`)

      yield* _(
        sql`CREATE INDEX IF NOT EXISTS idx_favorites_article ON favorites(user_email, article_slug, deleted);`
      )

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower, deleted);`)

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed, deleted);`)

      yield* _(
        sql`CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_slug, deleted);`
      )

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag, deleted);`)

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_jwts_jwt ON jwts(jwt, expires_at, revoked);`)

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_jwts_email ON jwts(user_email, expires_at, revoked);`)

      yield* _(sql`CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag, deleted);`)
    })
)
