import * as Pg from "@sqlfx/pg"
import * as Migrator from "@sqlfx/pg/Migrator"
import { Config, Layer } from "effect"

const PgLive = Pg.makeLayer(Config.all({
  host: Config.string("VITE_DATABASE_HOST"),
  port: Config.number("VITE_DATABASE_PORT"),
  database: Config.string("VITE_DATABASE_NAME"),
  username: Config.string("VITE_DATABASE_USER"),
  password: Config.secret("VITE_DATABASE_PASSWORD")
}))

const MigrationsLive = Layer.provide(
  Migrator.makeLayer({ loader: Migrator.fromGlob(import.meta.glob("./migrations/*.ts")) }),
  PgLive
)

export const DbLive = Layer.mergeAll(
  MigrationsLive,
  PgLive
)
