import * as Pg from "@effect/sql-pg"
import * as Migrator from "@effect/sql-pg/Migrator"
import { Layer } from "effect"
import { Kysely, PostgresDialect } from "kysely"
import PG from "pg"
import { makePg } from "./kysely"
import type * as DbSchema from "./schema.js"

export interface Database {
  users: DbSchema.DbUserEncoded
  articles: DbSchema.DbArticleEncoded
  comments: DbSchema.DbCommentEncoded
  tags: DbSchema.DbTagEncoded
  article_tags: DbSchema.DbArticleTagEncoded
  favorites: DbSchema.DbFavoriteEncoded
  follows: DbSchema.DbFollowEncoded
  jwt_tokens: DbSchema.DbJwtTokenEncoded
}

export const RealworldDb = makePg<Database>()

declare global {
  interface ImportMetaEnv {
    VITE_DATABASE_NAME: string
    VITE_DATABASE_HOST: string
    VITE_DATABASE_USER: string
    VITE_DATABASE_PASSWORD: string
    VITE_DATABASE_PORT: string
  }
}

const PgLive = RealworldDb.make(() =>
  new Kysely({
    dialect: new PostgresDialect({
      pool: new PG.Pool({
        database: import.meta.env.VITE_DATABASE_NAME,
        host: import.meta.env.VITE_DATABASE_HOST,
        user: import.meta.env.VITE_DATABASE_USER,
        password: import.meta.env.VITE_DATABASE_PASSWORD,
        port: parseInt(import.meta.env.VITE_DATABASE_PORT, 10)
      })
    })
  })
)

export const DbLive = Layer.provideMerge(
  Pg.migrator.layer({ loader: Migrator.fromGlob(import.meta.glob("./migrations/*")) }),
  PgLive
)
