import { AsyncData, Fx, Link } from "@typed/core"
import { CurrentUser, isAuthenticated } from "@typed/realworld/services"
import { NavLink } from "@typed/realworld/ui/components/NavLink"
import type { RenderEvent } from "@typed/template"
import { html } from "@typed/template"
import { Option } from "effect"
import * as pages from "./pages"

const UnauthenticatedHeader = html`<nav class="navbar navbar-light">
  <div class="container">
    ${Link({ to: "/", className: "navbar-brand" }, "conduit")}
    <ul class="nav navbar-nav pull-xs-right">
      ${NavLink({ content: "Home", route: pages.home.route }, {})}
      ${NavLink({ content: "Sign in", route: pages.login.route })}
      ${NavLink({ content: "Sign up", route: pages.register.route })}
    </ul>
  </div>
</nav>`

const AuthenticatedHeader = html`<nav class="navbar navbar-light">
  <div class="container">
    ${Link({ to: "/", className: "navbar-brand" }, "conduit")}
    <ul class="nav navbar-nav pull-xs-right">
      ${NavLink({ content: "Home", route: pages.home.route }, {})}
      ${NavLink({ content: html`<i class="mr-2 ion-compose"></i> New Article`, route: pages.editor.route })}
      ${NavLink({ content: html`<i class="mr-2 ion-gear-a"></i> Settings`, route: pages.settings.route })}
      ${
  CurrentUser.pipe(
    // Safe because AuthenticatedHeader is only rendered when the user is authenticated
    Fx.filterMap(AsyncData.getSuccess),
    Fx.switchMap(
      (user) =>
        NavLink(
          {
            content: html`<img src="${Option.getOrElse(user.image, () => "")}" class="user-pic" /> ${user.username}`,
            route: pages.profile.route
          },
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
    ${Link({ to: "/", className: "logo-font" }, "conduit")}
    <span class="attribution">
      An interactive learning project from <a href="https://thinkster.io">Thinkster</a>. Code & design licensed under MIT.
    </span>
  </div>
</footer>`

export function layout<E, R>(content: Fx.Fx<RenderEvent | null, E, R>) {
  return html`${Header}<main>${content}</main>${Footer}`.pipe(Fx.tap((x) => {
    console.log(x)
  }))
}
