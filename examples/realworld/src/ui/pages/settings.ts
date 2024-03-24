import { isAuthenticatedGuard } from "@/services"
import * as Route from "@typed/route"
import { html } from "@typed/template"

export const route = Route.fromPath("/settings").pipe(Route.guard(isAuthenticatedGuard))

export const main = html`<div class="settings-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 col-xs-12 offset-md-3">
        <h1 class="text-xs-center">Your Settings</h1>

        <ul class="error-messages">
          <li>That name is required</li>
        </ul>

        <form>
          <fieldset>
            <fieldset class="form-group">
              <input class="form-control" type="text" placeholder="URL of profile picture" />
            </fieldset>
            <fieldset class="form-group">
              <input class="form-control form-control-lg" type="text" placeholder="Your Name" />
            </fieldset>
            <fieldset class="form-group">
              <textarea
                class="form-control form-control-lg"
                rows="8"
                placeholder="Short bio about you"
              ></textarea>
            </fieldset>
            <fieldset class="form-group">
              <input class="form-control form-control-lg" type="text" placeholder="Email" />
            </fieldset>
            <fieldset class="form-group">
              <input
                class="form-control form-control-lg"
                type="password"
                placeholder="New Password"
              />
            </fieldset>
            <button class="btn btn-lg btn-primary pull-xs-right">Update Settings</button>
          </fieldset>
        </form>
        <hr />
        <button class="btn btn-outline-danger">Or click here to logout.</button>
      </div>
    </div>
  </div>
</div>`
