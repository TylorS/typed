import { AsyncData, Fx, html } from "@typed/core"
import { CurrentUser } from "@typed/realworld/services"
import { Either } from "effect"
import { failureOrCause } from "effect/Cause"

export const CurrentUserErrors = CurrentUser.pipe(
  Fx.switchMap((_) =>
    Fx.unify(AsyncData.match(_, {
      NoData: () => Fx.null,
      Loading: () => Fx.null,
      Failure: (cause) => {
        return failureOrCause(cause).pipe(
          Either.match({
            onLeft: (error) => {
              switch (error._tag) {
                case "Unauthorized":
                  return html`<ul class="error-messages">
                  <li>Invalid email or password</li>
                </ul>`
                case "Unprocessable":
                  return html`<ul class="error-messages">
                  ${error.errors.map((e) => html`<li>${e}</li>`)}
                </ul>`
              }
            },
            onRight: () => Fx.null
          })
        )
      },
      Success: () => Fx.null,
      Optimistic: () => Fx.null
    }))
  )
)
