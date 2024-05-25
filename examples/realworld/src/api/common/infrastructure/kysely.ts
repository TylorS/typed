import type { ParseResult, Schema } from "@effect/schema"
import * as Sql from "@effect/sql"
import * as Pg from "@effect/sql-pg"
import type { Connection } from "@effect/sql/Connection"
import { type Primitive } from "@effect/sql/Statement"
import * as Otel from "@opentelemetry/semantic-conventions"
import * as Ctx from "@typed/context"
import type { Cause, Option, Types } from "effect"
import { Chunk, Effect, Exit, Layer, Stream } from "effect"
import type {
  CreateIndexBuilder,
  CreateTableBuilder,
  DeleteQueryBuilder,
  InsertQueryBuilder,
  Kysely,
  SelectQueryBuilder,
  Transaction
} from "kysely"
import { CompiledQuery } from "kysely"
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

declare global {
  interface ImportMetaEnv {
    VITE_DATABASE_NAME: string
    VITE_DATABASE_HOST: string
    VITE_DATABASE_USER: string
    VITE_DATABASE_PASSWORD: string
    VITE_DATABASE_PORT: string
  }
}

type Compilable<A = void> =
  | SelectQueryBuilder<any, any, A>
  | DeleteQueryBuilder<any, any, A>
  | InsertQueryBuilder<any, any, A>
  | CreateTableBuilder<any, any>
  | CreateIndexBuilder<any>

export interface KyselyDatabase<DB> {
  readonly sql: Sql.client.Client
  readonly db: Kysely<DB>
  readonly kysely: <Out extends object>(
    f: (db: Kysely<DB>) => Compilable<Out>
  ) => Effect.Effect<ReadonlyArray<Out>, Sql.error.SqlError, never>
}

export const make = <DB>(makeClient: (db: Kysely<DB>) => Sql.client.Client) => {
  const Tag = Ctx.Tagged<KyselyDatabase<DB>, KyselyDatabase<DB>>("Kyseley/Database")
  const resolver = makeResolver<DB>(Tag)
  const schema = makeSchema<DB>(Tag)
  const make = (makeDb: () => Kysely<DB>): Layer.Layer<KyselyDatabase<DB> | Sql.client.Client> =>
    Layer.flatMap(
      Tag.scoped(Effect.gen(function*(_) {
        const db: Kysely<DB> = makeDb()
        const sql = makeClient(db)
        const kysely = <Out extends object>(f: (db: Kysely<DB>) => Compilable<Out>) => {
          // We utilize compile() and sql.unsafe to enable utilizing Effect's notion of a Transaction
          const compiled = f(db).compile()
          return sql.unsafe<Out>(compiled.sql, compiled.parameters as any)
        }

        // Close connection when out of scope
        yield* _(Effect.addFinalizer(() => Effect.promise(() => db.destroy())))

        return { sql, db, kysely } as const
      })),
      (ctx) => {
        const { sql } = Ctx.get(ctx, Tag)
        return Layer.succeedContext(Ctx.add(ctx, Sql.client.Client, sql))
      }
    )

  const withTransaction = <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ): Effect.Effect<A, Sql.error.SqlError | E, KyselyDatabase<DB> | R> =>
    Tag.withEffect(({ sql }) => sql.withTransaction(effect))

  const kysely = <Out extends object>(
    f: (db: Kysely<DB>) => Compilable<Out>
  ): Effect.Effect<ReadonlyArray<Out>, Sql.error.SqlError, KyselyDatabase<DB>> =>
    Tag.withEffect(({ kysely }) => kysely(f))

  const sql = (
    strings: TemplateStringsArray,
    ...args: Array<Sql.statement.Argument>
  ): Effect.Effect<ReadonlyArray<Sql.connection.Row>, Sql.error.SqlError, KyselyDatabase<DB>> =>
    Tag.withEffect(({ sql }) => sql(strings, ...args))

  return Object.assign(
    Tag,
    {
      resolver,
      schema,
      withTransaction,
      kysely,
      sql,
      make
    } as const
  )
}

export const makePg = <DB>() => make<DB>((db) => makeSqlClient(db, Pg.client.makeCompiler()))

export const RealworldDb = makePg<Database>()

function makeResolver<DB>(Tag: Ctx.Tagged<KyselyDatabase<DB>, KyselyDatabase<DB>>) {
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
    Tag.withEffect(({ kysely: query }) =>
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
    Tag.withEffect(({ kysely: query }) =>
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
    Tag.withEffect(({ kysely: query }) =>
      Sql.resolver.ordered(tag, { ...options, execute: (requests) => query((db) => options.execute(db, requests)) })
    )

  const void_ = <T extends string, I, II, RI>(
    tag: T,
    options: {
      readonly Request: Schema.Schema<I, II, RI>
      readonly execute: (db: Kysely<DB>, requests: Array<Types.NoInfer<II>>) => Compilable<object>
    }
  ): Effect.Effect<Sql.resolver.SqlResolver<T, I, void, Sql.error.SqlError, RI>, never, KyselyDatabase<DB>> =>
    Tag.withEffect(({ kysely: query }) =>
      Sql.resolver.void(tag, { ...options, execute: (requests) => query((db) => options.execute(db, requests)) })
    )

  return {
    findById,
    grouped,
    ordered,
    void: void_
  } as const
}

function makeSchema<DB>(Tag: Ctx.Tagged<KyselyDatabase<DB>, KyselyDatabase<DB>>) {
  const findAll = <IR, II, IA, AR, AI extends object, A>(
    options: {
      readonly Request: Schema.Schema<IA, II, IR>
      readonly Result: Schema.Schema<A, AI, AR>
      readonly execute: (db: Kysely<DB>, request: II) => Compilable<AI>
    }
  ) =>
  (
    request: IA
  ): Effect.Effect<ReadonlyArray<A>, ParseResult.ParseError | Sql.error.SqlError, IR | AR | KyselyDatabase<DB>> =>
    Tag.withEffect(({ kysely: query }) =>
      Sql.schema.findAll({ ...options, execute: (req) => query((db) => options.execute(db, req)) })(request)
    )

  const select = <IR, II, IA, A, AI extends object, AR>(options: {
    readonly Request: Schema.Schema<IA, II, IR>
    readonly Result: Schema.Schema<A, AI, AR>
    readonly execute: (db: Kysely<DB>, request: II) => Compilable<Types.NoInfer<AI>>
  }) =>
  (
    request: IA
  ): Effect.Effect<ReadonlyArray<A>, ParseResult.ParseError | Sql.error.SqlError, IR | AR | KyselyDatabase<DB>> =>
    Tag.withEffect(({ kysely: query }) =>
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
    Tag.withEffect(({ kysely: query }) =>
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
    Tag.withEffect(({ kysely: query }) =>
      Sql.schema.single({ ...options, execute: (req) => query((db) => options.execute(db, req)) })(request)
    )

  const void_ = <IR, II, IA>(
    options: {
      readonly Request: Schema.Schema<IA, II, IR>
      readonly execute: (request: II, db: Kysely<DB>) => Compilable<object>
    }
  ) =>
  (request: IA): Effect.Effect<void, ParseResult.ParseError | Sql.error.SqlError, IR | KyselyDatabase<DB>> =>
    Tag.withEffect(({ kysely: query }) =>
      Sql.schema.void({ ...options, execute: (req) => query((db) => options.execute(req, db)) })(request)
    )

  return {
    findAll,
    select,
    findOne,
    single,
    void: void_
  } as const
}

function makeSqlClient<DB>(database: Kysely<DB>, compiler: Sql.statement.Compiler): Sql.client.Client {
  const transformRows = Sql.statement.defaultTransforms((s) => s, false).array

  class ConnectionImpl implements Connection {
    constructor(private readonly db: Kysely<DB>) {}

    execute(sql: string, params: ReadonlyArray<Primitive>) {
      return Effect.tryPromise({
        try: () => this.db.executeQuery(compileSqlQuery(sql, params)).then((r) => transformRows(r.rows)),
        catch: (error) => new Sql.error.SqlError({ error })
      })
    }

    executeWithoutTransform(sql: string, params: ReadonlyArray<Primitive>) {
      return Effect.tryPromise({
        try: () => this.db.executeQuery(compileSqlQuery(sql, params)).then((r) => r.rows),
        catch: (error) => new Sql.error.SqlError({ error })
      })
    }

    executeValues(sql: string, params: ReadonlyArray<Primitive>) {
      return Effect.map(
        this.executeRaw(sql, params),
        (results) => results.map((x) => Object.values(x as {}) as Array<Primitive>)
      )
    }

    executeRaw(sql: string, params?: ReadonlyArray<Primitive>) {
      return Effect.tryPromise({
        try: () => this.db.executeQuery(compileSqlQuery(sql, params)).then((r) => transformRows(r.rows)),
        catch: (error) => new Sql.error.SqlError({ error })
      })
    }

    executeStream(sql: string, params: ReadonlyArray<Primitive>) {
      return Stream.suspend(() => {
        const executor = this.db.getExecutor()
        return Stream.mapChunks(
          Stream.fromAsyncIterable(
            executor.stream(compileSqlQuery(sql, params), 16, { queryId: createQueryId() }),
            (error) => new Sql.error.SqlError({ error })
          ),
          Chunk.flatMap((result) => Chunk.unsafeFromArray(result.rows))
        )
      })
    }
  }

  return Sql.client.make({
    acquirer: Effect.succeed(new ConnectionImpl(database)),
    compiler,
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
): CompiledQuery<object> {
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

function createQueryId() {
  return randomString(8)
}

const CHARS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9"
]
export function randomString(length: number) {
  let chars = ""
  for (let i = 0; i < length; ++i) {
    chars += randomChar()
  }
  return chars
}
function randomChar() {
  return CHARS[~~(Math.random() * CHARS.length)]
}
