import { ArrayFormatter } from "@effect/schema"
import { AsyncData, EventHandler, Fx, html, Link, RefAsyncData, RefSubject, Router } from "@typed/core"
import type { EventWithTarget } from "@typed/dom/EventTarget"
import { parseFormData } from "@typed/realworld/lib/Schema"
import { CurrentUser, Users } from "@typed/realworld/services"
import { Unprocessable } from "@typed/realworld/services/errors"
import { LoginInput } from "@typed/realworld/services/Login"
import * as Routes from "@typed/realworld/ui/common/routes"
import { CurrentUserErrors } from "@typed/realworld/ui/services/CurrentUser"
import { Effect } from "effect"

export const route = Routes.login

type SubmitEvent = EventWithTarget<HTMLFormElement, Event>

export const main = Fx.gen(function*(_) {
  const hasSubmitted = yield* _(RefSubject.of<boolean>(false))
  const onSubmit = EventHandler.preventDefault((ev: SubmitEvent) =>
    Effect.zipRight(loginUser(ev), RefSubject.set(hasSubmitted, true))
  )

  return html`<div class="auth-page">
    <div class="container page">
      <div class="row">
        <div class="col-md-6 col-xs-12 offset-md-3">
          <h1 class="text-xs-center">Sign in</h1>
          <p class="text-xs-center">
            ${Link({ to: Routes.register.interpolate({}) }, `Need an account?`)}
          </p>

          ${Fx.if(hasSubmitted, { onFalse: Fx.null, onTrue: CurrentUserErrors })}

          <form onsubmit=${onSubmit}>
            <fieldset class="form-group">
              <input
                name="email"
                class="form-control form-control-lg"
                type="text"
                placeholder="Email"
              />
            </fieldset>
            <fieldset class="form-group">
              <input
                name="password"
                class="form-control form-control-lg"
                type="password"
                placeholder="Password"
              />
            </fieldset>
            <button class="btn btn-lg btn-primary pull-xs-right">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>`
})

function loginUser(ev: SubmitEvent) {
  return Effect.catchTag(
    Effect.gen(function*(_) {
      const current = yield* _(CurrentUser)

      // Only allow one login request at a time
      if (AsyncData.isLoadingOrRefreshing(current)) return current

      const data = new FormData(ev.target)
      const input = yield* _(data, parseFormData(LoginInput.fields))

      const updated = yield* _(RefAsyncData.runAsyncData(CurrentUser, Users.login(input)))

      // Navigate to home page if login is successful
      if (AsyncData.isSuccess(updated)) {
        yield* _(Router.navigate(Routes.home, { history: "replace", relative: false }))
      }

      return updated
    }),
    "ParseError",
    (error) => {
      const issues = ArrayFormatter.formatErrorSync(error)
      const errors = issues.map((issue) => issue.message)
      return RefSubject.set(
        CurrentUser,
        AsyncData.fail(new Unprocessable({ errors }))
      )
    }
  )
}
