import { parseFormData } from "@/lib/Schema"
import { CurrentUser, isAuthenticated, Users } from "@/services"
import { Unprocessable } from "@/services/errors"
import { LoginInput } from "@/services/Login"
import { CurrentUserErrors } from "@/ui/services/CurrentUser"
import { ArrayFormatter } from "@effect/schema"
import { AsyncData, EventHandler, Fx, html, Navigation, RefAsyncData, RefSubject, Route } from "@typed/core"
import type { EventWithTarget } from "@typed/dom/EventTarget"
import { isDom } from "@typed/environment"
import { Effect } from "effect"

export const route = Route.literal("/login")

export const main = Fx.gen(function*(_) {
  if (yield* _(isDom)) {
    yield* _(
      isAuthenticated,
      Fx.if({
        onFalse: Fx.fromEffect(Effect.logDebug("Not authenticated")),
        onTrue: Fx.fromEffect(Navigation.navigate("/", { history: "replace" }))
      }),
      Fx.forkScoped
    )
  }
  return html`<div class="auth-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 col-xs-12 offset-md-3">
        <h1 class="text-xs-center">Sign in</h1>
        <p class="text-xs-center">
          <a href="/register">Need an account?</a>
        </p>

        ${CurrentUserErrors}
        
        <form onsubmit=${EventHandler.preventDefault(loginUser)}>
          <fieldset class="form-group">
            <input name="email" class="form-control form-control-lg" type="text" placeholder="Email" />
          </fieldset>
          <fieldset class="form-group">
            <input name="password" class="form-control form-control-lg" type="password" placeholder="Password" />
          </fieldset>
          <button class="btn btn-lg btn-primary pull-xs-right">Sign in</button>
        </form>
      </div>
    </div>
  </div>
</div>`
})

function loginUser(ev: EventWithTarget<HTMLFormElement, Event>) {
  return Effect.gen(function*(_) {
    const current = yield* _(CurrentUser)

    // Only allow one login request at a time
    if (AsyncData.isLoadingOrRefreshing(current)) return

    const data = new FormData(ev.target)
    const input = yield* _(data, parseFormData(LoginInput.fields))

    yield* _(RefAsyncData.runAsyncData(CurrentUser, Users.login(input)))
  }).pipe(
    Effect.catchAll((error) => {
      const issues = ArrayFormatter.formatErrorSync(error)
      const errors = issues.map((issue) => issue.message)
      return RefSubject.set(CurrentUser, AsyncData.fail(new Unprocessable({ errors })))
    })
  )
}
