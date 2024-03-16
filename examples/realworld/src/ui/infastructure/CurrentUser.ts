import { JwtToken } from "@/model"
import { CurrentUser, ReadJwtToken, SaveJwtToken } from "@/ui/services"
import { AsyncData } from "@typed/core"
import { SchemaStorage } from "@typed/dom/Storage"
import { Effect } from "effect"

export const CurrentUserLive = CurrentUser.make(Effect.succeed(AsyncData.noData()))

const JWT_TOKEN_KEY = "user_jwt_token"

const storage = SchemaStorage({
  [JWT_TOKEN_KEY]: JwtToken
})

export const SaveJwtTokenLive = SaveJwtToken.implement((token) =>
  Effect.ignoreLogged(storage.set(JWT_TOKEN_KEY, token))
)

export const ReadJwtTokenLive = ReadJwtToken.implement(() =>
  Effect.catchAll(storage.get(JWT_TOKEN_KEY), () => Effect.succeedNone)
)
