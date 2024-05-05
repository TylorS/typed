import * as Http from "@effect/platform/HttpServer"
import { AsyncData, RefSubject } from "@typed/core"
import { CurrentJwt, verifyJwt } from "@typed/realworld/api/common/infrastructure/CurrentJwt"
import { JwtToken } from "@typed/realworld/model"
import { CurrentUser } from "@typed/realworld/services"
import { Effect, Layer, Option } from "effect"

export const CurrentUserLive = Layer.scopedContext(Effect.gen(function*(_) {
  const { headers } = yield* _(Http.request.ServerRequest)
  const token = Http.headers.get(headers, "authorization").pipe(
    Option.map((authorization) => JwtToken(authorization.split(" ")[1])),
    Option.orElse(() =>
      Http.headers.get(headers, "cookie").pipe(
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

  const ref = yield* verifyJwt(token.value).pipe(
    Effect.exit,
    Effect.map(AsyncData.fromExit),
    Effect.flatMap(RefSubject.of<RefSubject.Success<typeof CurrentUser>>)
  )

  return CurrentUser.tag.build(ref).merge(CurrentJwt.build(token.value)).context
}))
