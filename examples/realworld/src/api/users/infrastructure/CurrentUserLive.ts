import * as Http from "@effect/platform/HttpServer"
import { CurrentJwt } from "@realworld/api/common/infrastructure/CurrentJwt"
import { JwtToken } from "@realworld/model"
import { CurrentUser, Users } from "@realworld/services"
import { AsyncData, RefSubject } from "@typed/core"
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

  if (Option.isNone(token)) {
    const { context } = CurrentUser.tag.build(
      yield* RefSubject.of<RefSubject.Success<typeof CurrentUser>>(AsyncData.noData())
    )
    return context
  }

  const ref = yield* Users.current().pipe(
    Effect.exit,
    Effect.map(AsyncData.fromExit),
    Effect.flatMap(RefSubject.of<RefSubject.Success<typeof CurrentUser>>)
  )

  return CurrentUser.tag.build(ref).merge(CurrentJwt.build(token.value)).context
}))
