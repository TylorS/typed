import { ArrayFormatter } from "@effect/schema"
import { AsyncData, EventHandler, Fx, html, Link, RefAsyncData, RefSubject } from "@typed/core"
import type { EventWithTarget } from "@typed/dom/EventTarget"
import { parseFormData } from "@typed/realworld/lib/Schema"
import { CurrentUser, Users } from "@typed/realworld/services"
import { Unprocessable } from "@typed/realworld/services/errors"
import { RegisterInput } from "@typed/realworld/services/Register"
import * as Routes from "@typed/realworld/ui/common/routes"
import { useCurrentUserErrors } from "@typed/realworld/ui/components/CurrentUserErrors"
import { Effect } from "effect"

export const route = Routes.register

export const main = Fx.gen(function*(_) {
  const userErrors = yield* _(useCurrentUserErrors)
  const onSubmit = EventHandler.target<HTMLFormElement>({ preventDefault: true })((ev) =>
    Effect.zipRight(registerUser(ev), userErrors.onSubmit)
  )

  return html`<div class="auth-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 col-xs-12 offset-md-3">
        <h1 class="text-xs-center">Sign up</h1>
        <p class="text-xs-center">
          ${Link({ to: Routes.login.interpolate({}) }, `Have an account?`)}
        </p>

        ${userErrors.view}

        <form onsubmit=${onSubmit}>
          <fieldset class="form-group">
            <input
              autocomplete="username"
              name="username"
              class="form-control form-control-lg"
              type="text"
              placeholder="Username"
            />
          </fieldset>
          <fieldset class="form-group">
            <input
              autocomplete="email"
              name="email"
              class="form-control form-control-lg"
              type="text"
              placeholder="Email"
            />
          </fieldset>
          <fieldset class="form-group">
            <input
              autocomplete="password"
              name="password"
              class="form-control form-control-lg"
              type="password"
              placeholder="Password"
            />
          </fieldset>
          <button class="btn btn-lg btn-primary pull-xs-right">Sign up</button>
        </form>
      </div>
    </div>
  </div>
</div>`
})

function registerUser(ev: EventWithTarget<HTMLFormElement, Event>) {
  return Effect.gen(function*(_) {
    const current = yield* _(CurrentUser)

    // Only allow one login request at a time
    if (AsyncData.isLoadingOrRefreshing(current)) return current

    const data = new FormData(ev.target)
    const input = yield* _(data, parseFormData(RegisterInput.fields))

    return yield* _(RefAsyncData.runAsyncData(CurrentUser, Users.register(input)))
  }).pipe(
    Effect.catchAll((error) => {
      const issues = ArrayFormatter.formatIssueSync(error.error)
      const errors = issues.map((issue) => issue.message)
      return RefSubject.set(
        CurrentUser,
        AsyncData.fail(new Unprocessable({ errors }))
      )
    })
  )
}
