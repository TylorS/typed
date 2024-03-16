import { HashPassword, HashPasswordLive } from "@/api/common/infrastructure/HashPassword"
import { DbJwtToken, DbUser } from "@/api/common/infrastructure/schema"
import { JwtToken, type User, UserId } from "@/model"
import { Users } from "@/services"
import { Unprocessable } from "@/services/errors"
import type { RegisterInput } from "@/services/Register"
import { TreeFormatter } from "@effect/schema"
import * as Pg from "@sqlfx/pg"
import type { SchemaError, SqlError } from "@sqlfx/pg/Error"
import { makeNanoId } from "@typed/id"
import type { ConfigError } from "effect"
import { Clock, Config, Effect, Layer, Option } from "effect"
import jwt from "jsonwebtoken"

export const UsersLive = Users.implement({
  current: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  register: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)
      const inputUser = yield* _(dbUserFromRegisterInput(input))
      const { token } = yield* _(creatJwtTokenForUser(inputUser))
      const user = yield* _(
        sql.schemaSingle(
          DbUser,
          DbUser,
          (u) => sql`insert into users ${sql.insert(u)}`
        )(inputUser)
      )

      return dbUserToUser(user, token)
    }).pipe(
      Effect.catchAll(toUnprocessable)
    ),
  login: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    }),
  update: () =>
    Effect.gen(function*(_) {
      return yield* _(Effect.dieMessage(`Not implemented`))
    })
}).pipe(
  Layer.provide(HashPasswordLive)
)

function dbUserFromRegisterInput({ email, password, username }: RegisterInput) {
  return Effect.gen(function*(_) {
    const id = UserId(yield* _(makeNanoId))
    const now = new Date(yield* _(Clock.currentTimeMillis))
    const dbUser: DbUser = {
      id,
      email,
      username,
      password: yield* _(HashPassword(password)),
      bio: null,
      image: null,
      created_at: now,
      updated_at: now
    }

    return dbUser
  })
}

function creatJwtTokenForUser(user: DbUser) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Pg.tag)
    const id = yield* _(makeNanoId)
    const now = new Date(yield* _(Clock.currentTimeMillis))
    const secret = yield* _(Config.string("VITE_JWT_SECRET"))
    const token = JwtToken(jwt.sign(user, secret))
    const jwtToken: DbJwtToken = {
      id,
      user_id: user.id,
      token,
      created_at: now
    }
    return yield* _(
      sql.schemaSingle(DbJwtToken, DbJwtToken, (t) => sql`insert into jwt_tokens ${sql.insert(t)}`)(jwtToken)
    )
  })
}

function dbUserToUser(user: DbUser, token: JwtToken): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    bio: Option.fromNullable(user.bio),
    image: Option.fromNullable(user.image),
    token
  }
}

function toUnprocessable(error: SqlError | SchemaError | ConfigError.ConfigError) {
  switch (error._tag) {
    case "SqlError":
      return new Unprocessable({ errors: [error.message] })
    case "SchemaError":
      return new Unprocessable({ errors: [TreeFormatter.formatIssue(error.error)] })
    default: // ConfigError
      return new Unprocessable({ errors: [error.toString()] })
  }
}
