import { getCurrentJwt, verifyJwt } from "@/api/common/infrastructure/CurrentJwt"
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
import * as Pg from "@sqlfx/pg"
import { makeNanoId } from "@typed/id"
import { Clock, Config, Effect, Layer, Option } from "effect"
import jwt from "jsonwebtoken"

export const UsersLive = Users.implement({
  current: () =>
    Effect.gen(function*(_) {
      const token = yield* _(getCurrentJwt)
      const user = yield* _(verifyJwt(token))
      const dbUser = yield* _(getDbUserByEmail(user.email), Effect.flatten, Effect.catchAll(() => new Unauthorized()))

      return dbUserToUser(dbUser, token)
    }).pipe(catchExpectedErrors),
  register: (input) =>
    Effect.gen(function*(_) {
      const sql = yield* _(Pg.tag)
      const existingUser = yield* _(getDbUserByEmail(input.email))
      if (Option.isSome(existingUser)) {
        return yield* _(new Unprocessable({ errors: ["Email already exists"] }))
      }

      const inputUser = yield* _(dbUserFromRegisterInput(input))
      const user = yield* _(
        inputUser,
        sql.schemaSingle(DbUser, DbUser, (t) => sql`insert into users ${sql.insert(t)} returning *;`)
      )
      const { token } = yield* _(creatJwtTokenForUser(user))

      return dbUserToUser(user, token)
    }).pipe(catchExpectedErrors),
  login: (input) =>
    Effect.gen(function*(_) {
      const user = yield* _(getDbUserByEmail(input.email))
      if (Option.isNone(user)) {
        return yield* _(new Unauthorized())
      }

      const dbUser = user.value
      if (!(yield* _(ComparePassword(input.password, dbUser.password)))) {
        return yield* _(new Unauthorized())
      }

      const existingToken = yield* _(getUnexpiredJwtTokenForUser(dbUser))
      if (Option.isSome(existingToken)) {
        return dbUserToUser(dbUser, existingToken.value.token)
      }

      const { token } = yield* _(creatJwtTokenForUser(dbUser))
      return dbUserToUser(dbUser, token)
    }).pipe(catchExpectedErrors),
  update: (user) =>
    Effect.gen(function*(_) {
      const token = yield* _(getCurrentJwt)
      yield* _(verifyJwt(token))

      const sql = yield* _(Pg.tag)
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

      return dbUserToUser(dbUser, token)
    }).pipe(catchExpectedErrors)
}).pipe(
  Layer.provide(HashPasswordLive),
  Layer.provide(ComparePasswordLive)
)

function getDbUserByEmail(email: Email) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Pg.tag)
    return yield* _(
      email,
      sql.schemaSingleOption(Email, DbUser, (t) => sql`select * from users where email = ${t}`)
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
    const sql = yield* _(Pg.tag)
    const now = new Date(yield* _(Clock.currentTimeMillis))
    return yield* _(
      user.id,
      sql.schemaSingleOption(
        UserId,
        DbJwtToken,
        (t) => sql`select * from jwt_tokens where user_id = ${t} and created_at > ${now} - interval '7 days'`
      )
    )
  }).pipe(Effect.catchAllCause(() => Effect.succeedNone))
}

function creatJwtTokenForUser(user: DbUser) {
  return Effect.gen(function*(_) {
    const sql = yield* _(Pg.tag)
    const id = yield* _(makeNanoId)
    const now = new Date(yield* _(Clock.currentTimeMillis))
    const secret = yield* _(Config.string("VITE_JWT_SECRET"))
    const { password: __, ...jwtUser } = user
    const token = JwtToken(jwt.sign(jwtUser, secret, { expiresIn: "7d" }))
    const jwtToken: DbJwtToken = {
      id,
      user_id: user.id,
      token,
      created_at: now
    }

    return yield* _(
      jwtToken,
      sql.schemaSingle(DbJwtToken, DbJwtToken, (t) => sql`insert into jwt_tokens ${sql.insert(t)} returning *;`)
    )
  })
}
