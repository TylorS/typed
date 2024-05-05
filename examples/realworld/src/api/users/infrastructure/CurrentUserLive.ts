import { AsyncData, RefSubject } from "@typed/core"
import { CurrentJwt, getJwtTokenFromRequest, verifyJwt } from "@typed/realworld/api/common/infrastructure/CurrentJwt"
import { CurrentUser } from "@typed/realworld/services"
import { Effect, Layer, Option } from "effect"

export const CurrentUserLive = Layer.scopedContext(Effect.gen(function*(_) {
  const token = yield* _(getJwtTokenFromRequest)

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
