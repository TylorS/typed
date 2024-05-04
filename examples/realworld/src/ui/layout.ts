import { CurrentUser, isAuthenticated } from "@realworld/services"
import { NavLink } from "@realworld/ui/components/NavLink"
import * as Fx from "@typed/fx"
import * as RefAsyncData from "@typed/fx/AsyncData"
import type { RenderEvent } from "@typed/template"
import { html } from "@typed/template"
import { Option } from "effect"
import { Link } from "./components/Link"
import * as pages from "./pages"

const UnauthenticatedHeader = html`<nav class="navbar navbar-light">
  <div class="container">
    ${Link({ href: "/", className: "navbar-brand", content: "conduit" })}
    <ul class="nav navbar-nav pull-xs-right">
      ${NavLink("Home", pages.home.route, {})}
      ${NavLink("Sign in", pages.login.route)}
      ${NavLink("Sign up", pages.register.route)}
    </ul>
  </div>
</nav>`

const AuthenticatedHeader = html`<nav class="navbar navbar-light">
  <div class="container">
    ${Link({ href: "/", className: "navbar-brand", content: "conduit" })}
    <ul class="nav navbar-nav pull-xs-right">
      ${NavLink("Home", pages.home.route, {})}
      ${NavLink(Fx.take(html`<i class="mr-2 ion-compose"></i> New Article`, 1), pages.editor.route)}
      ${NavLink(Fx.take(html`<i class="mr-2 ion-gear-a"></i> Settings`, 1), pages.settings.route)}
      ${
  CurrentUser.pipe(
    RefAsyncData.getSuccess,
    Fx.switchMap(
      (user) =>
        NavLink(
          html`<img src="${Option.getOrElse(user.image, () => "")}" class="user-pic" /> ${user.username}`,
          pages.profile.route,
          {
            username: user.username
          }
        )
    )
  )
}
    </ul>
  </div>
</nav>`

const Header = Fx.if(
  isAuthenticated,
  {
    onFalse: UnauthenticatedHeader,
    onTrue: AuthenticatedHeader
  }
)

const Footer = html`<footer>
  <div class="container">
    ${Link({ href: "/", className: "logo-font", content: "conduit" })}
    <span class="attribution">
      An interactive learning project from <a href="https://thinkster.io">Thinkster</a>. Code & design licensed under MIT.
    </span>
  </div>
</footer>`

export function layout<E, R>(content: Fx.Fx<RenderEvent | null, E, R>) {
  return html`${Header}<main>${content}</main>${Footer}`
}
