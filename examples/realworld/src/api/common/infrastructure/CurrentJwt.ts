import { DbUser, dbUserToUser } from "@/api/common/infrastructure/schema"
import type { JwtToken } from "@/model"
import { Unauthorized } from "@/services/errors"
import { Schema } from "@effect/schema"
import { Context } from "@typed/core"
import { Config, Effect } from "effect"
import jwt from "jsonwebtoken"

export const CurrentJwt = Context.Tagged<JwtToken>()("CurrentJwt")

export const getCurrentJwtOption = Effect.serviceOption(CurrentJwt)

export const getCurrentJwt = getCurrentJwtOption.pipe(
  Effect.flatMap((_) => _),
  Effect.catchAll(() => new Unauthorized())
)

export const verifyJwt = (token: JwtToken) =>
  Effect.gen(function*(_) {
    const secret = yield* _(Config.string("VITE_JWT_SECRET"))
    const payload = jwt.verify(token, secret)
    const dbUser = yield* _(payload, Schema.decodeUnknown(DbUser))
    return dbUserToUser(dbUser, token)
  }).pipe(
    Effect.catchAll(() => new Unauthorized())
  )
