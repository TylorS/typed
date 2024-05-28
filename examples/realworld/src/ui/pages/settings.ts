import { ArrayFormatter } from "@effect/schema"
import { AsyncData, Fx, RefAsyncData, RefSubject, Router } from "@typed/core"
import type { EventWithTarget } from "@typed/dom/EventTarget"
import { parseFormData } from "@typed/realworld/lib/Schema"
import { CurrentUser, isAuthenticatedGuard, Users } from "@typed/realworld/services"
import { Unprocessable } from "@typed/realworld/services/errors"
import { UpdateUserInput } from "@typed/realworld/services/UpdateUser"
import * as Routes from "@typed/realworld/ui/common/routes"
import { useCurrentUserErrors } from "@typed/realworld/ui/components/CurrentUserErrors"
import { EventHandler, html } from "@typed/template"
import { Effect, Option } from "effect"

export const route = Routes.settings.pipe(isAuthenticatedGuard)

type SubmitEvent = EventWithTarget<HTMLFormElement>

export const main = Fx.gen(function*(_) {
  const userErrors = yield* _(useCurrentUserErrors)
  const onSubmit = EventHandler.preventDefault((ev: SubmitEvent) =>
    Effect.zipRight(updateUser(ev), userErrors.onSubmit)
  )

  // We expect this to be a success since we are guarding this route
  const user = RefSubject.proxy(RefAsyncData.getSuccess(CurrentUser))
  const userImage = RefSubject.map(user.image, Option.getOrElse(() => ""))

  const logoutCurrentUser = RefSubject.set(CurrentUser, AsyncData.noData()).pipe(
    Effect.zipRight(Users.logout()),
    Effect.zipRight(Router.navigate(Routes.login, { relative: false }))
  )

  return html`<div class="settings-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 col-xs-12 offset-md-3">
        <h1 class="text-xs-center">Your Settings</h1>
      
        ${userErrors.view}

        <form onsubmit=${onSubmit}>
          <fieldset>
            <fieldset class="form-group">
              <input
                class="form-control"
                type="text"
                placeholder="URL of profile picture"
                name="image"
                .value=${userImage}
              />
            </fieldset>
            <fieldset class="form-group">
              <input
                class="form-control form-control-lg"
                type="text"
                placeholder="Your Name"
                name="name"
                .value=${user.username}
              />
            </fieldset>
            <fieldset class="form-group">
              <textarea
                class="form-control form-control-lg"
                rows="8"
                placeholder="Short bio about you"
                name="bio"
                .value=${RefSubject.map(user.bio, Option.getOrElse(() => ""))}
              ></textarea>
            </fieldset>
            <fieldset class="form-group">
              <input
                class="form-control form-control-lg"
                type="text"
                placeholder="Email"
                name="email"
                .value=${user.email}
              />
            </fieldset>
            <fieldset class="form-group">
              <input
                class="form-control form-control-lg"
                type="password"
                placeholder="New Password"
                name="password"
                autocomplete="off"
              />
            </fieldset>
            <button type="submit" class="btn btn-lg btn-primary pull-xs-right">
              Update Settings
            </button>
          </fieldset>
        </form>
        <hr />
        <button type="button" class="btn btn-outline-danger" onclick=${logoutCurrentUser}>Or click here to logout.</button>
      </div>
    </div>
  </div>
</div>`
})

function updateUser(ev: SubmitEvent) {
  return Effect.catchTag(
    Effect.gen(function*(_) {
      const current = yield* _(CurrentUser)

      // Only allow one submit request at a time
      if (AsyncData.isLoadingOrRefreshing(current)) return current

      const data = new FormData(ev.target)
      const input = yield* _(data, parseFormData(UpdateUserInput.fields))
      const exit = yield* _(Users.update(input), Effect.exit)
      return yield* _(RefSubject.set(CurrentUser, AsyncData.fromExit(exit)))
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
