import { client } from "@/api"
import { addJwtTokenToRequest } from "@/api/common/spec"
import { JwtToken } from "@/model"
import { CurrentUser, ReadJwtToken, RemoveJwtToken, SaveJwtToken } from "@/services"
import { handleClientRequest } from "@/ui/infastructure/_client"
import { Schema } from "@effect/schema"
import { AsyncData } from "@typed/core"
import { SchemaStorage } from "@typed/dom/Storage"
import { Effect, Layer, Option } from "effect"

export const CurrentUserLive = CurrentUser.make(
  Effect.gen(function* (_) {
    const jwtToken = yield* _(ReadJwtToken())
    if (Option.isNone(jwtToken)) {
      return AsyncData.noData()
    }

    return yield* _(
      client.getCurrentUser({ path: {} }, addJwtTokenToRequest(jwtToken.value)),
      handleClientRequest,
      Effect.map((r) => r.user),
      Effect.tapErrorCause(() => RemoveJwtToken()),
      Effect.exit,
      Effect.map(AsyncData.fromExit)
    )
  })
)

const JWT_TOKEN_KEY = "user_jwt_token"

const storage = SchemaStorage({ [JWT_TOKEN_KEY]: Schema.parseJson(JwtToken) })

export const SaveJwtTokenLive = SaveJwtToken.implement((token) =>
  Effect.catchAllCause(storage.set(JWT_TOKEN_KEY, token), (c) => Effect.logError(c))
)

export const ReadJwtTokenLive = ReadJwtToken.implement(() =>
  Effect.catchAllCause(storage.get(JWT_TOKEN_KEY), () => Effect.succeedNone)
)

export const RemoveJwtTokenLive = RemoveJwtToken.implement(() => Effect.ignoreLogged(storage.remove(JWT_TOKEN_KEY)))

export const Live = CurrentUserLive.pipe(
  Layer.provideMerge(Layer.mergeAll(ReadJwtTokenLive, SaveJwtTokenLive, RemoveJwtTokenLive))
)
