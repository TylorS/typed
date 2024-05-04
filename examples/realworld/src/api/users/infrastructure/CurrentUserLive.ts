import * as Http from "@effect/platform/HttpServer"
import { CurrentJwt } from "@realworld/api/common/infrastructure/CurrentJwt"
import { JwtToken } from "@realworld/model"
import { CurrentUser, Users } from "@realworld/services"
import { AsyncData } from "@typed/core"
import { Effect, Layer, Option } from "effect"

export const CurrentUserLive = Layer.scopedContext(Effect.gen(function*(_) {
  const { headers } = yield* _(Http.request.ServerRequest)
  const token = Http.headers.get(headers, "authorization").pipe(
    Option.map((authorization) => JwtToken(authorization.split(" ")[1])),
    Option.orElse(() =>
      Http.headers.get(headers, "cookies").pipe(
        Option.map(Http.cookies.parseHeader),
        Option.flatMap((_) => Option.fromNullable(_["conduit-token"])),
        Option.map(JwtToken)
      )
    )
  )

  // Set the CurrentJwt to the Token we parsed from the headers
  yield* _(Effect.locallyScoped(CurrentJwt, token))

  return yield* Layer.build(Option.match(token, {
    // Don't bother fetching the User if there is no token
    onNone: () => CurrentUser.make(Effect.succeed(AsyncData.noData()), { take: 1 }),
    // Attempt to fetch the current user with the Token
    onSome: () => CurrentUser.make(Users.current().pipe(Effect.exit, Effect.map(AsyncData.fromExit)), { take: 1 })
  }))
}))
