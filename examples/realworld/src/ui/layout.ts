import { CurrentUser, isAuthenticated } from "@/services"
import type { Path, Placeholder, RenderEvent } from "@typed/core"
import { EventHandler, Fx, html, Navigation, RefAsyncData, Route } from "@typed/core"
import { Option } from "effect"
import * as pages from "./pages"

const UnauthenticatedHeader = html`<nav class="navbar navbar-light">
  <div class="container">
    <a class="navbar-brand" href="/">conduit</a>
    <ul class="nav navbar-nav pull-xs-right">
      ${NavLink("Home", pages.home.route)}
      ${NavLink("Sign in", pages.login.route)}
      ${NavLink("Sign up", pages.register.route)}
    </ul>
  </div>
</nav>`

const AuthenticatedHeader = html`<nav class="navbar navbar-light">
  <div class="container">
    <a class="navbar-brand" href="/">conduit</a>
    <ul class="nav navbar-nav pull-xs-right">
      ${NavLink("Home", pages.home.route)}
      ${NavLink(Fx.take(html`<i class="mr-2 ion-compose"></i> New Article`, 1), pages.editor.route)}
      ${NavLink(Fx.take(html`<i class="mr-2 ion-gear-a"></i> Settings`, 1), pages.settings.route)}
      ${
  CurrentUser.pipe(
    RefAsyncData.getSuccess,
    Fx.takeOneIfNotDomEnvironment,
    Fx.switchMap(
      (user) =>
        NavLink(
          html`<img src=${Option.getOrElse(user.image, () => "")} class="user-pic" /> ${user.username}`,
          pages.profile.route.route,
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
  Fx.takeOneIfNotDomEnvironment(isAuthenticated),
  {
    onFalse: UnauthenticatedHeader,
    onTrue: AuthenticatedHeader
  }
)

const Footer = html`<footer>
  <div class="container">
    <a href="/" class="logo-font">conduit</a>
    <span class="attribution">
      An interactive learning project from <a href="https://thinkster.io">Thinkster</a>. Code & design licensed under MIT.
    </span>
  </div>
</footer>`

function NavLink<E, R, P extends string, A = Path.ParamsOf<P>, E2 = never, R2 = never>(
  content: Placeholder<string | RenderEvent, E, R>,
  input: Route.RouteInput<P, A, E2, R2>,
  ...params: Path.ParamsList<P>
) {
  const { route } = Route.asRouteGuard(input)
  const to: string = route.make(...params as any)

  return html`<li class="nav-item">
    <a
      class="nav-link" 
      href="${to}"
      onclick="${EventHandler.preventDefault(() => Navigation.navigate(to))}">
      ${content}
    </a>
  </li>`
}

export function layout<E, R>(content: Fx.Fx<RenderEvent | null, E, R>) {
  return html`${Header}<main>${content}</main>${Footer}`
}
