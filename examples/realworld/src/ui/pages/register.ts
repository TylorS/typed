import { html, Route } from "@typed/core"

export const route = Route.fromPath("/register")

export const main = html`<div class="auth-page">
  <div class="container page">
    <div class="row">
      <div class="col-md-6 col-xs-12 offset-md-3">
        <h1 class="text-xs-center">Sign up</h1>
        <p class="text-xs-center">
          <a href="/login">Have an account?</a>
        </p>

        <ul class="error-messages">
          <li>That email is already taken</li>
        </ul>

        <form action="/api/register" method="POST">
          <fieldset class="form-group">
            <input class="form-control form-control-lg" type="text" placeholder="Username" />
          </fieldset>
          <fieldset class="form-group">
            <input class="form-control form-control-lg" type="text" placeholder="Email" />
          </fieldset>
          <fieldset class="form-group">
            <input class="form-control form-control-lg" type="password" placeholder="Password" />
          </fieldset>
          <button class="btn btn-lg btn-primary pull-xs-right">Sign up</button>
        </form>
      </div>
    </div>
  </div>
</div>`
