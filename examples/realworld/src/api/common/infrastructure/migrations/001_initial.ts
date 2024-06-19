import * as Sql from "@effect/sql"
import * as Effect from "effect/Effect"

export default Effect.flatMap(
  Sql.client.Client,
  (sql) =>
    sql`
      -- Users
      CREATE TABLE users(
        id varchar(21) PRIMARY KEY,
        email varchar(255) NOT NULL,
        username varchar(50) NOT NULL,
        password varchar(255) NOT NULL,
        bio text,
        image text,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Articles
      CREATE TABLE articles(
        id varchar(21) PRIMARY KEY,
        author_id varchar(21) NOT NULL,
        slug varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        description text NOT NULL,
        body text NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id)
      );
      
      -- Comments
      CREATE TABLE comments(
        id varchar(21) PRIMARY KEY,
        article_id varchar(21) NOT NULL,
        author_id varchar(21) NOT NULL,
        body text NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
      );
      
      -- Tags
      CREATE TABLE tags(
        id varchar(21) PRIMARY KEY,
        name varchar(255) NOT NULL
      );
      
      -- ArticleTags
      CREATE TABLE article_tags(
        article_id varchar(21) NOT NULL,
        tag_id varchar(255) NOT NULL,
        PRIMARY KEY (article_id, tag_id),
        FOREIGN KEY (article_id) REFERENCES articles(id),
        FOREIGN KEY (tag_id) REFERENCES tags(id)
      );
      
      -- Favorites
      CREATE TABLE favorites(
        user_id varchar(21) NOT NULL,
        article_id varchar(21) NOT NULL,
        PRIMARY KEY (user_id, article_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (article_id) REFERENCES articles(id)
      );
      
      -- Follows
      CREATE TABLE follows(
        follower_id varchar(21) NOT NULL,
        followed_id varchar(21) NOT NULL,
        PRIMARY KEY (follower_id, followed_id),
        FOREIGN KEY (follower_id) REFERENCES users(id),
        FOREIGN KEY (followed_id) REFERENCES users(id)
      );

      -- JWT
      CREATE TABLE jwt_tokens(
        id varchar(21) PRIMARY KEY,
        user_id varchar(21) NOT NULL,
        token text NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      -- Indexes
      CREATE INDEX articles_author_id_idx ON articles(author_id);
      
      CREATE INDEX comments_article_id_idx ON comments(article_id);
      
      CREATE INDEX comments_author_id_idx ON comments(author_id);
      
      CREATE INDEX article_tags_article_id_idx ON article_tags(article_id);
      
      CREATE INDEX article_tags_tag_id_idx ON article_tags(tag_id);
      
      CREATE INDEX favorites_user_id_idx ON favorites(user_id);
      
      CREATE INDEX favorites_article_id_idx ON favorites(article_id);
      
      CREATE INDEX follows_follower_id_idx ON follows(follower_id);
      
      CREATE INDEX follows_followed_id_idx ON follows(followed_id);

      CREATE INDEX jwt_tokens_user_id_idx ON jwt_tokens(user_id);
    `
)
