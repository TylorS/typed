import { CurrentUser } from "@/services"
import { Fx, html, many, RefAsyncData } from "@typed/core"

export const CurrentUserErrors = CurrentUser.pipe(
  RefAsyncData.matchAsyncData({
    NoData: Fx.succeed(null),
    Loading: () => Fx.succeed(null),
    Failure: Fx.matchTags({
      Unauthorized: () =>
        html`<ul class="error-messages">
        <li>Invalid email or password</li>
      </ul>`,
      Unprocessable: (error) =>
        html`<ul class="error-messages">
        ${
          many(
            Fx.map(error, (e) => {
              console.log(e)
              return e.errors
            }),
            (e) => e,
            (e) => html`<li>${e}</li>`
          )
        }
      </ul>`
    }),
    Success: () => Fx.succeed(null)
  })
)
