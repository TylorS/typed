import { Schema } from "@effect/schema"
import { Tagged } from "@typed/context"
import { DbUser, dbUserToUser } from "@typed/realworld/api/common/infrastructure/schema"
import type { User } from "@typed/realworld/model"
import { JwtToken } from "@typed/realworld/model"
import { Unauthorized } from "@typed/realworld/services/errors"
import { Cookies, ServerHeaders, ServerRequest } from "@typed/server"
import { Config, Effect, Option } from "effect"

export const CurrentJwt = Tagged<JwtToken>()("CurrentJwt")

export const getCurrentJwtOption = Effect.serviceOption(CurrentJwt)

export const getJwtTokenFromRequest = Effect.gen(function*(_) {
  const { headers } = yield* _(ServerRequest.ServerRequest)
  return ServerHeaders.get(headers, "cookie").pipe(
    Option.map(Cookies.parseHeader),
    Option.flatMap((_) => Option.fromNullable(_["conduit-token"])),
    Option.map(JwtToken),
    Option.orElse(() =>
      ServerHeaders.get(headers, "authorization").pipe(
        Option.map((authorization) => JwtToken(authorization.split(" ")[1]))
      )
    )
  )
})

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
    const jwt = yield* _(Effect.promise(() => import("jsonwebtoken").then((m) => m.default)))
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
