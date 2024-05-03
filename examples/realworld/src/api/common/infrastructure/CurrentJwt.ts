import { DbUser, dbUserToUser } from "@/api/common/infrastructure/schema"
import type { JwtToken, User } from "@/model"
import { Unauthorized } from "@/services/errors"
import { Schema } from "@effect/schema"
import { Config, Effect, FiberRef, Option } from "effect"
import jwt from "jsonwebtoken"

export const CurrentJwt = FiberRef.unsafeMake<Option.Option<JwtToken>>(Option.none())

export const getCurrentJwtOption = FiberRef.get(CurrentJwt)

export const getCurrentJwt = getCurrentJwtOption.pipe(
  Effect.flatten,
  Effect.catchAll(() => new Unauthorized())
)

export const JwtUser = DbUser.pipe(
  Schema.omit("password", "created_at", "updated_at"),
  Schema.extend(Schema.Struct({
    created_at: Schema.DateFromString,
    updated_at: Schema.DateFromString
  }))
)

export const verifyJwt = (token: JwtToken) =>
  Effect.gen(function*(_) {
    const secret = yield* _(Config.string("VITE_JWT_SECRET"))
    const payload = jwt.verify(token, secret)
    const dbUser = yield* _(
      payload,
      Schema.decodeUnknown(JwtUser, { onExcessProperty: "ignore" })
    )
    return dbUserToUser(dbUser, token)
  }).pipe(
    Effect.catchAll(() => new Unauthorized())
  )

export const getOptionalCurrentJwtUser: Effect.Effect<Option.Option<User>> = Effect.gen(function*(_) {
  const option = yield* _(getCurrentJwtOption)
  if (Option.isNone(option)) {
    return Option.none()
  }

  return Option.some(yield* _(verifyJwt(option.value)))
}).pipe(
  Effect.catchAll(() => Effect.succeedNone)
)

export const getCurrentJwtUser: Effect.Effect<User, Unauthorized> = Effect.gen(function*(_) {
  const token = yield* _(getCurrentJwt)
  return yield* _(verifyJwt(token))
})
