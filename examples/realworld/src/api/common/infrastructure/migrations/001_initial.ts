import * as Effect from "effect/Effect"
import { sql } from "kysely"
import { RealworldDb } from "../db"

const logTableCreate = (tableName: string) => Effect.logInfo(`Creating table ${tableName}...`)

export default Effect.gen(function*(_) {
  yield* _(Effect.logInfo("Creating tables..."))

  // Users
  yield* _(logTableCreate("users"))
  yield* _(RealworldDb.kysely((db) =>
    db.schema.createTable("users")
      .addColumn("id", "varchar(21)", (c) => c.primaryKey())
      .addColumn("email", "varchar(255)", (c) => c.notNull())
      .addColumn("username", "varchar(50)", (c) => c.notNull())
      .addColumn("password", "varchar(255)", (c) => c.notNull())
      .addColumn("bio", "text")
      .addColumn("image", "text")
      .addColumn("created_at", "timestamp", (c) => c.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
      .addColumn("updated_at", "timestamp", (c) => c.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
  ))

  // Articles
  yield* logTableCreate("articles")
  yield* _(RealworldDb.kysely((db) =>
    db.schema.createTable("articles")
      .addColumn("id", "varchar(21)", (c) => c.primaryKey())
      .addColumn("author_id", "varchar(21)", (c) => c.references("users.id").notNull())
      .addColumn("slug", "varchar(255)", (c) => c.notNull())
      .addColumn("title", "varchar(255)", (c) => c.notNull())
      .addColumn("description", "text", (c) => c.notNull())
      .addColumn("body", "text", (c) => c.notNull())
      .addColumn("created_at", "timestamp", (c) => c.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
      .addColumn("updated_at", "timestamp", (c) => c.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
  ))

  // Comments
  yield* logTableCreate("comments")
  yield* _(RealworldDb.kysely((db) =>
    db.schema.createTable("comments")
      .addColumn("id", "varchar(21)", (c) => c.primaryKey())
      .addColumn("article_id", "varchar(21)", (c) => c.references("articles.id").notNull())
      .addColumn("author_id", "varchar(21)", (c) => c.references("users.id").notNull())
      .addColumn("body", "text", (c) => c.notNull())
      .addColumn("created_at", "timestamp", (c) => c.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
      .addColumn("updated_at", "timestamp", (c) => c.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
  ))

  // Tags
  yield* logTableCreate("tags")
  yield* _(RealworldDb.kysely((db) =>
    db.schema.createTable("tags")
      .addColumn("id", "varchar(21)", (c) => c.primaryKey())
      .addColumn("name", "varchar(255)", (c) => c.notNull())
  ))

  // ArticleTags
  yield* logTableCreate("article_tags")
  yield* _(RealworldDb.kysely((db) =>
    db.schema.createTable("article_tags")
      .addColumn("article_id", "varchar(21)", (col) => col.references("articles.id").notNull())
      .addColumn("tag_id", "varchar(255)", (col) => col.references("tags.id").notNull())
      .addPrimaryKeyConstraint("article_tags_pkey", ["article_id", "tag_id"])
  ))

  // Favorites
  yield* logTableCreate("favorites")
  yield* _(RealworldDb.kysely((db) =>
    db.schema.createTable("favorites")
      .addColumn("user_id", "varchar(21)", (col) => col.references("users.id").notNull())
      .addColumn("article_id", "varchar(21)", (col) => col.references("articles.id").notNull())
      .addPrimaryKeyConstraint("favorites_pkey", ["user_id", "article_id"])
  ))

  // Follows
  yield* logTableCreate("follows")
  yield* _(RealworldDb.kysely((db) =>
    db.schema.createTable("follows")
      .addColumn("follower_id", "varchar(21)", (col) => col.references("users.id").notNull())
      .addColumn("followed_id", "varchar(21)", (col) => col.references("users.id").notNull())
      .addPrimaryKeyConstraint("follows_pkey", ["follower_id", "followed_id"])
  ))

  // JWT
  yield* logTableCreate("jwt_tokens")
  yield* _(RealworldDb.kysely((db) =>
    db.schema.createTable("jwt_tokens")
      .addColumn("id", "varchar(21)", (c) => c.primaryKey())
      .addColumn("user_id", "varchar(21)", (c) => c.references("users.id").notNull())
      .addColumn("token", "text", (c) => c.notNull())
      .addColumn("created_at", "timestamp", (c) => c.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
  ))

  // Indexes
  yield* _(Effect.logInfo("Creating indexes..."))

  yield* _(
    RealworldDb.kysely((db) => db.schema.createIndex("articles_author_id_idx").on("articles").column("author_id"))
  )
  yield* _(
    RealworldDb.kysely((db) => db.schema.createIndex("comments_article_id_idx").on("comments").column("article_id"))
  )
  yield* _(
    RealworldDb.kysely((db) => db.schema.createIndex("comments_author_id_idx").on("comments").column("author_id"))
  )
  yield* _(
    RealworldDb.kysely((db) =>
      db.schema.createIndex("article_tags_article_id_idx").on("article_tags").column("article_id")
    )
  )
  yield* _(
    RealworldDb.kysely((db) => db.schema.createIndex("article_tags_tag_id_idx").on("article_tags").column("tag_id"))
  )
  yield* _(RealworldDb.kysely((db) => db.schema.createIndex("favorites_user_id_idx").on("favorites").column("user_id")))
  yield* _(
    RealworldDb.kysely((db) => db.schema.createIndex("favorites_article_id_idx").on("favorites").column("article_id"))
  )
  yield* _(
    RealworldDb.kysely((db) => db.schema.createIndex("follows_follower_id_idx").on("follows").column("follower_id"))
  )
  yield* _(
    RealworldDb.kysely((db) => db.schema.createIndex("follows_followed_id_idx").on("follows").column("followed_id"))
  )
  yield* _(
    RealworldDb.kysely((db) => db.schema.createIndex("jwt_tokens_user_id_idx").on("jwt_tokens").column("user_id"))
  )

  yield* _(Effect.logInfo("Tables and indexes created!"))
})
