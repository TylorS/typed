import { getCurrentJwtUser, JwtUser } from "@/api/common/infrastructure/CurrentJwt"
import { catchExpectedErrors } from "@/api/common/infrastructure/errors"
import {
  ComparePassword,
  ComparePasswordLive,
  HashPassword,
  HashPasswordLive
} from "@/api/common/infrastructure/Passwords"
import { DbJwtToken, DbUser, dbUserToUser } from "@/api/common/infrastructure/schema"
import { Email, JwtToken, UserId } from "@/model"
import { Users } from "@/services"
import { Unauthorized, Unprocessable } from "@/services/errors"
import type { RegisterInput } from "@/services/Register"
import { Schema } from "@effect/schema"
import * as Pg from "@effect/sql-pg"
import { makeNanoId } from "@typed/id"
import { Clock, Config, Effect, Layer, Option } from "effect"
import jwt from "jsonwebtoken"

export const UsersLive = Users.implement({
  current: () =>
    Effect.gen(function*(_) {
      const user = yield* _(getCurrentJwtUser)
      const dbUser = yield* _(getDbUserByEmail(user.email), Effect.flatten, Effect.catchAll(() => new Unauthorized()))

      return dbUserToUser(dbUser, user.token)
    }).pipe(catchExpectedErrors),
  register: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.client.PgClient)
      const existingUser = yield* _(getDbUserByEmail(input.email))
      if (Option.isSome(existingUser)) {
        return yield* _(new Unprocessable({ errors: ["Email already exists"] }))
      }

      const inputUser = yield* _(dbUserFromRegisterInput(input))
      const user = yield* _(
        inputUser,
        Pg.schema.single({
          Request: DbUser,
          Result: DbUser,
          execute: (t) => sql`insert into users ${sql.insert(t)} returning *;`
        })
      )
      const { token } = yield* _(creatJwtTokenForUser(user))

      return dbUserToUser(user, token)
    }).pipe(catchExpectedErrors),
  login: (input) =>
    Effect.gen(function*() {
      const user = yield* getDbUserByEmail(input.email)
      if (Option.isNone(user)) {
        return yield* new Unauthorized()
      }

      const dbUser = user.value
      if (!(yield* ComparePassword(input.password, dbUser.password))) {
        return yield* new Unauthorized()
      }

      const existingToken = yield* getUnexpiredJwtTokenForUser(dbUser)
      if (Option.isSome(existingToken)) {
        return dbUserToUser(dbUser, existingToken.value.token)
      }

      const { token } = yield* creatJwtTokenForUser(dbUser)
      return dbUserToUser(dbUser, token)
    }).pipe(catchExpectedErrors),
  update: (user) =>
    Effect.gen(function*(_) {
      const current = yield* _(getCurrentJwtUser)
      const sql = yield* _(Pg.client.PgClient)
      const now = new Date(yield* _(Clock.currentTimeMillis))
      const [rawUser] = yield* _(
        sql`update users set 
        ${Option.match(user.username, { onNone: () => sql``, onSome: (t) => sql`username = ${t},` })}
        ${Option.match(user.bio, { onNone: () => sql``, onSome: (t) => sql`bio = ${t},` })}
        ${Option.match(user.image, { onNone: () => sql``, onSome: (t) => sql`image = ${t},` })}
        updated_at = ${now}
        where email = ${user.email}
        returning *;`
      )
      const dbUser = yield* _(rawUser, Schema.decodeUnknown(DbUser))

      return dbUserToUser(dbUser, current.token)
    }).pipe(catchExpectedErrors)
}).pipe(
  Layer.provide(HashPasswordLive),
  Layer.provide(ComparePasswordLive)
)

function getDbUserByEmail(email: Email) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Pg.client.PgClient)
    return yield* _(
      email,
      Pg.schema.findOne({
        Request: Email,
        Result: DbUser,
        execute: (t) => sql`select * from users where email = ${t}`
      })
    )
  }).pipe(Effect.catchAllCause(() => Effect.succeedNone))
}

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

function getUnexpiredJwtTokenForUser(user: DbUser) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Pg.client.PgClient)
    const now = new Date(yield* _(Clock.currentTimeMillis))
    return yield* _(
      user.id,
      Pg.schema.findOne(
        {
          Request: UserId,
          Result: DbJwtToken,
          execute: (t) => sql`select * from jwt_tokens where user_id = ${t} and created_at > ${now} - interval '7 days'`
        }
      )
    )
  }).pipe(Effect.catchAllCause(() => Effect.succeedNone))
}

function creatJwtTokenForUser(user: DbUser) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Pg.client.PgClient)
    const id = yield* _(makeNanoId)
    const now = new Date(yield* _(Clock.currentTimeMillis))
    const secret = yield* _(Config.string("VITE_JWT_SECRET"))
    const jwtUser = yield* _(user, Schema.encode(JwtUser))
    const token = JwtToken(jwt.sign(jwtUser, secret, { expiresIn: "7d" }))
    const jwtToken: DbJwtToken = {
      id,
      user_id: user.id,
      token,
      created_at: now
    }

    yield* _(
      jwtToken,
      Pg.schema.void({
        Request: DbJwtToken,
        execute: (t) => sql`insert into jwt_tokens ${sql.insert(t)} returning *;`
      })
    )

    return jwtToken
  })
}
