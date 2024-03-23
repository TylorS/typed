import { CurrentUser } from "@/services"
import { Fx, html, many, RefAsyncData } from "@typed/core"

export const CurrentUserErrors = CurrentUser.pipe(
  Fx.takeOneIfNotDomEnvironment,
  RefAsyncData.matchAsyncData({
    NoData: Fx.null,
    Loading: () => Fx.null,
    Failure: Fx.matchTags({
      Unauthorized: () =>
        html`<ul class="error-messages">
        <li>Invalid email or password</li>
      </ul>`,
      Unprocessable: (error) =>
        html`<ul class="error-messages">
        ${
          many(
            Fx.map(error, (e) => e.errors),
            (e) => e,
            (e) => html`<li>${e}</li>`
          )
        }
      </ul>`
    }),
    Success: () => Fx.null
  })
)
