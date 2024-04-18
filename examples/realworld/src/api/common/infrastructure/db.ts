import * as Pg from "@effect/sql-pg"
import * as Migrator from "@effect/sql-pg/Migrator"
import { Config, Layer } from "effect"

const PgLive = Pg.client.layer(Config.all({
  host: Config.string("VITE_DATABASE_HOST"),
  port: Config.number("VITE_DATABASE_PORT"),
  database: Config.string("VITE_DATABASE_NAME"),
  username: Config.string("VITE_DATABASE_USER"),
  password: Config.secret("VITE_DATABASE_PASSWORD")
}))

export const DbLive = Layer.mergeAll(
  Layer.provide(
    Pg.migrator.layer({ loader: Migrator.fromGlob(import.meta.glob("./migrations/*")) }),
    PgLive
  ),
  PgLive
)
