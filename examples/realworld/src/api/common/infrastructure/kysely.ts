import type { ParseResult } from "@effect/schema"
import { Schema } from "@effect/schema"
import * as Sql from "@effect/sql"
import * as Pg from "@effect/sql-pg"
import type { Connection } from "@effect/sql/Connection"
import { type Primitive } from "@effect/sql/Statement"
import * as Otel from "@opentelemetry/semantic-conventions"
import { Tagged } from "@typed/context"
import { UserId } from "@typed/realworld/model"
import type { Cause, Option, Types } from "effect"
import { Effect, Exit } from "effect"
import type {
  DatabaseConnection,
  DatabaseIntrospector,
  DeleteQueryBuilder,
  DialectAdapter,
  Driver,
  InsertQueryBuilder,
  KyselyConfig,
  QueryCompiler,
  SelectQueryBuilder,
  Transaction
} from "kysely"
import {
  CompiledQuery,
  Kysely,
  PostgresAdapter,
  PostgresDialect,
  PostgresIntrospector,
  PostgresQueryCompiler
} from "kysely"
import { Pool } from "pg"
import { DbLive } from "./db.js"
import * as DbSchema from "./schema.js"

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

declare global {
  interface ImportMetaEnv {
    VITE_DATABASE_NAME: string
    VITE_DATABASE_HOST: string
    VITE_DATABASE_USER: string
    VITE_DATABASE_PORT: string
  }
}

export const dialect = new PostgresDialect({
  pool: new Pool({
    database: import.meta.env.VITE_DATABASE_NAME,
    host: import.meta.env.VITE_DATABASE_HOST,
    user: import.meta.env.VITE_DATABASE_USER,
    port: parseInt(import.meta.env.VITE_DATABASE_PORT, 10),
    max: 10
  })
})

type Compilable<A> =
  | SelectQueryBuilder<any, any, A>
  | DeleteQueryBuilder<any, any, A>
  | InsertQueryBuilder<any, any, A>

export interface KyselyDatabase<DB> {
  readonly sql: Sql.client.Client
  readonly db: Kysely<DB>
  readonly query: <Out extends object>(
    f: (db: Kysely<DB>) => Compilable<Out>
  ) => Effect.Effect<ReadonlyArray<Out>, Sql.error.SqlError, never>
}

export const make = <DB>(dialect: {
  createAdapter: () => DialectAdapter
  createIntrospector: (db: Kysely<DB>) => DatabaseIntrospector
  createQueryCompiler: () => QueryCompiler
}) => {
  const Tag = Tagged<KyselyDatabase<DB>, KyselyDatabase<DB>>("Kyseley/Database")
  const resolver = makeResolver<DB>(Tag)
  const schema = makeSchema<DB>(Tag)

  // TODO: We should probably allow for creating the DB via a function
  const layer = (config?: Omit<KyselyConfig, "dialect">) =>
    Tag.layer(Effect.gen(function*(_) {
      const sql = yield* _(Sql.client.Client)
      const db: Kysely<DB> = new Kysely<DB>({
        ...config,
        dialect: {
          createAdapter: dialect.createAdapter,
          createDriver() {
            const driver: Driver = {
              // This is handled by instantiating Sql.client.Client
              init: async () => {},
              destroy: async () => {},

              // Adapt Client API to Kysely APIs
              acquireConnection: async () => {
                const conn: DatabaseConnection = {
                  async executeQuery(compiledQuery: CompiledQuery<unknown>) {},
                  async streamQuery(compiledQuery: CompiledQuery<unknown>, chunkSize?: number) {}
                }

                return conn
              },
              beginTransaction: async (conn, settings) => {},
              commitTransaction: async (conn) => {},
              rollbackTransaction: async (conn) => {},
              releaseConnection: async (conn) => {}
            }

            return driver
          },
          createIntrospector() {
            return dialect.createIntrospector(db)
          },
          createQueryCompiler: dialect.createQueryCompiler
        }
      })
      const query = <Out extends object>(f: (db: Kysely<DB>) => Compilable<Out>) => {
        const compiled = f(db).compile()
        return sql.unsafe<Out>(compiled.sql, compiled.parameters as any)
      }

      return { sql, db, query } as const
    }))

  return {
    Tag,
    resolver,
    schema,
    layer
  } as const
}

export const makePg = <DB>() =>
  make<DB>({
    createAdapter: () => new PostgresAdapter(),
    createIntrospector: (db) => new PostgresIntrospector(db),
    createQueryCompiler: () => new PostgresQueryCompiler()
  })

export const MyDatabase = makePg<Database>()

const findUserById = MyDatabase.schema.findOne(
  {
    Request: Schema.String,
    Result: DbSchema.DbUser,
    execute: (db, id) => db.selectFrom("users").selectAll().where("id", "=", id)
  }
)

export const test = findUserById(UserId.make("Test")).pipe(
  Effect.provide(MyDatabase.layer()),
  Effect.provide(DbLive)
)

function makeResolver<DB>(Tag: Tagged<KyselyDatabase<DB>, KyselyDatabase<DB>>) {
  const findById = <T extends string, I, II, RI, A, IA, Row extends object>(
    tag: T,
    options: {
      readonly Id: Schema.Schema<I, II, RI>
      readonly Result: Schema.Schema<A, IA, never>
      readonly ResultId: (result: Types.NoInfer<A>, row: Types.NoInfer<Row>) => II
      readonly execute: (db: Kysely<DB>, requests: Array<Types.NoInfer<II>>) => Compilable<Row>
    }
  ): Effect.Effect<
    Sql.resolver.SqlResolver<T, I, Option.Option<A>, Sql.error.SqlError, RI>,
    never,
    KyselyDatabase<DB>
  > =>
    Tag.withEffect(({ query }) =>
      Sql.resolver.findById(tag, { ...options, execute: (requests) => query((db) => options.execute(db, requests)) })
    )

  const grouped = <T extends string, I, II, K, RI, A, IA, Row extends object>(
    tag: T,
    options: {
      readonly Request: Schema.Schema<I, II, RI>
      readonly RequestGroupKey: (request: Types.NoInfer<II>) => K
      readonly Result: Schema.Schema<A, IA, never>
      readonly ResultGroupKey: (result: Types.NoInfer<A>, row: Types.NoInfer<Row>) => K
      readonly execute: (
        db: Kysely<DB>,
        requests: Array<Types.NoInfer<II>>
      ) => Compilable<Row>
    }
  ): Effect.Effect<Sql.resolver.SqlResolver<T, I, Array<A>, Sql.error.SqlError, RI>, never, KyselyDatabase<DB>> =>
    Tag.withEffect(({ query }) =>
      Sql.resolver.grouped(tag, {
        ...options,
        execute: (requests) => query<Row>((db) => options.execute(db, requests))
      })
    )

  const ordered = <T extends string, I, II, RI, A, IA extends object, _>(
    tag: T,
    options: {
      readonly Request: Schema.Schema<I, II, RI>
      readonly Result: Schema.Schema<A, IA, never>
      readonly execute: (db: Kysely<DB>, requests: Array<Types.NoInfer<II>>) => Compilable<IA>
    }
  ): Effect.Effect<
    Sql.resolver.SqlResolver<T, I, A, Sql.error.ResultLengthMismatch | Sql.error.SqlError, RI>,
    never,
    KyselyDatabase<DB>
  > =>
    Tag.withEffect(({ query }) =>
      Sql.resolver.ordered(tag, { ...options, execute: (requests) => query((db) => options.execute(db, requests)) })
    )

  const void_ = <T extends string, I, II, RI>(
    tag: T,
    options: {
      readonly Request: Schema.Schema<I, II, RI>
      readonly execute: (db: Kysely<DB>, requests: Array<Types.NoInfer<II>>) => Compilable<object>
    }
  ): Effect.Effect<Sql.resolver.SqlResolver<T, I, void, Sql.error.SqlError, RI>, never, KyselyDatabase<DB>> =>
    Tag.withEffect(({ query }) =>
      Sql.resolver.void(tag, { ...options, execute: (requests) => query((db) => options.execute(db, requests)) })
    )

  return {
    findById,
    grouped,
    ordered,
    void: void_
  } as const
}

function makeSchema<DB>(Tag: Tagged<KyselyDatabase<DB>, KyselyDatabase<DB>>) {
  const select = <IR, II, IA, A, AI extends object, AR>(options: {
    readonly Request: Schema.Schema<IA, II, IR>
    readonly Result: Schema.Schema<A, AI, AR>
    readonly execute: (db: Kysely<DB>, request: II) => Compilable<Types.NoInfer<AI>>
  }) =>
  (
    request: IA
  ): Effect.Effect<ReadonlyArray<A>, ParseResult.ParseError | Sql.error.SqlError, IR | AR | KyselyDatabase<DB>> =>
    Tag.withEffect(({ query }) =>
      Sql.schema.findAll({ ...options, execute: (req) => query((db) => options.execute(db, req)) })(request)
    )

  const findOne = <IR, II, IA, AR, AI extends object, A>(
    options: {
      readonly Request: Schema.Schema<IA, II, IR>
      readonly Result: Schema.Schema<A, AI, AR>
      execute: (db: Kysely<DB>, request: II) => Compilable<AI>
    }
  ) =>
  (
    request: IA
  ): Effect.Effect<Option.Option<A>, ParseResult.ParseError | Sql.error.SqlError, IR | AR | KyselyDatabase<DB>> =>
    Tag.withEffect(({ query }) =>
      Sql.schema.findOne({ ...options, execute: (req) => query((db) => options.execute(db, req)) })(request)
    )

  const single = <IR, II, IA, AR, AI extends object, A>(
    options: {
      readonly Request: Schema.Schema<IA, II, IR>
      readonly Result: Schema.Schema<A, AI, AR>
      readonly execute: (db: Kysely<DB>, request: II) => Compilable<AI>
    }
  ) =>
  (
    request: IA
  ): Effect.Effect<
    A,
    ParseResult.ParseError | Cause.NoSuchElementException | Sql.error.SqlError,
    IR | AR | KyselyDatabase<DB>
  > =>
    Tag.withEffect(({ query }) =>
      Sql.schema.single({ ...options, execute: (req) => query((db) => options.execute(db, req)) })(request)
    )

  const void_ = <IR, II, IA>(
    options: {
      readonly Request: Schema.Schema<IA, II, IR>
      readonly execute: (request: II, db: Kysely<DB>) => Compilable<object>
    }
  ) =>
  (request: IA): Effect.Effect<void, ParseResult.ParseError | Sql.error.SqlError, IR | KyselyDatabase<DB>> =>
    Tag.withEffect(({ query }) =>
      Sql.schema.void({ ...options, execute: (req) => query((db) => options.execute(req, db)) })(request)
    )

  return {
    select,
    findOne,
    single,
    void: void_
  } as const
}

function makePgSqlClient<DB>(database: Kysely<DB>): Sql.client.Client {
  const transformRows = Sql.statement.defaultTransforms((s) => s, false).array

  class ConnectionImpl implements Connection {
    constructor(readonly db: Kysely<DB>) {}

    executeRaw: (
      sql: string,
      params?: ReadonlyArray<Sql.statement.Primitive> | undefined
    ) => Effect.Effect<ReadonlyArray<any>, Sql.error.SqlError, never> = (sql, params) =>
      Effect.tryPromise(
        {
          try: () => database.executeQuery(compileSqlQuery(sql, params)).then((result) => result.rows),
          catch: (error) => new Sql.error.SqlError({ error })
        }
      )
  }

  return Sql.client.make({
    acquirer: Effect.sync(() => new ConnectionImpl(database)),
    compiler: Pg.client.makeCompiler(),
    transactionAcquirer: Effect.gen(function*(_) {
      const { trx } = yield* _(
        Effect.acquireRelease(Effect.promise(() => begin(database)), (trx, exit) =>
          Effect.sync(() =>
            Exit.match(exit, {
              onFailure: () => trx.rollback(),
              onSuccess: () => trx.commit()
            })
          ))
      )

      return new ConnectionImpl(trx)
    }),
    spanAttributes: [
      [Otel.SEMATTRS_DB_SYSTEM, Otel.DBSYSTEMVALUES_POSTGRESQL],
      [Otel.SEMATTRS_DB_NAME, "postgres"]
    ]
  })
}

function compileSqlQuery(
  sql: string,
  params?: ReadonlyArray<Primitive>
): CompiledQuery {
  return CompiledQuery.raw(sql, params as any)
}

async function begin<DB>(db: Kysely<DB>) {
  const connection = new DeferredPromise<Transaction<DB>>()
  const result = new DeferredPromise<any>()

  // Do NOT await this line.
  db.transaction().execute((trx) => {
    connection.resolve(trx)
    return result.promise
  }).catch(() => {
    // Don't do anything here. Just swallow the exception.
  })

  const trx = await connection.promise

  return {
    trx,
    commit() {
      result.resolve(null)
    },
    rollback() {
      result.reject(new Error("rollback"))
    }
  }
}
class DeferredPromise<T> {
  readonly _promise: Promise<T>

  _resolve?: (value: T | PromiseLike<T>) => void
  _reject?: (reason?: any) => void

  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._reject = reject
      this._resolve = resolve
    })
  }

  get promise(): Promise<T> {
    return this._promise
  }

  resolve = (value: T | PromiseLike<T>): void => {
    if (this._resolve) {
      this._resolve(value)
    }
  }

  reject = (reason?: any): void => {
    if (this._reject) {
      this._reject(reason)
    }
  }
}
