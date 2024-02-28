import { GetCurrentUser, InvalidTokenError } from "@/services"
import { Effect, Secret } from "effect"
import { makeJwtUser } from "./common/MakeJwt"
import { DbServices } from "./db/Db"

export const GetCurrentUserLive = GetCurrentUser.implement((token) =>
  Effect.gen(function*(_) {
    const Db = yield* _(DbServices)
    const jwt = yield* _(Db.getJwt(Secret.value(token)), Effect.flatten)
    const dbUser = yield* _(Db.getUserByEmail(jwt.user_email), Effect.flatten)

    return yield* _(makeJwtUser(Db, dbUser, token))
  }).pipe(
    Effect.tapError((error) => Effect.logError(error)),
    Effect.catchAll(() => Effect.fail(new InvalidTokenError(token)))
  )
)
