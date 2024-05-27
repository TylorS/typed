import { AsyncData, Fx, html, RefSubject } from "@typed/core"
import { CurrentUser } from "@typed/realworld/services"
import { Effect, Option } from "effect"

export const CurrentUserErrors = CurrentUser.pipe(
  Fx.map(AsyncData.getFailure),
  Fx.switchMap(
    Option.match({
      onNone: () => Fx.null,
      onSome: (error) => {
        return html`<ul class="error-messages">
          ${
          error._tag === "Unauthorized"
            ? html`<li>Invalid email or password</li>`
            : error.errors.map((e) => html`<li>${e}</li>`)
        }
        </ul>`
      }
    })
  )
)

export const useCurrentUserErrors = Effect.gen(function*() {
  const hasSubmitted = yield* RefSubject.of<boolean>(false)
  const view = Fx.if(hasSubmitted, {
    onFalse: Fx.null,
    onTrue: CurrentUserErrors
  })

  return {
    view,
    hasSubmitted,
    onSubmit: RefSubject.set(hasSubmitted, true)
  }
})
