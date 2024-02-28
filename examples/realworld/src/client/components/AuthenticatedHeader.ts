import { editorRoute, homeRoute, profileRoute, settingsRoute } from "@/client/routes"
import { CurrentUserImage, CurrentUsername } from "@/services"
import * as Fx from "@typed/fx"
import { html } from "@typed/template"
import { NavLink } from "./NavLink"

export const AuthenticatedHeader = html`
<nav class="navbar navbar-light">
  <div class="container">
    <a class="navbar-brand" href="/">conduit</a>
    <ul class="nav navbar-nav pull-xs-right">
      <li class="nav-item">
        ${NavLink("Home", homeRoute)}
      </li>
      <li class="nav-item">
        ${NavLink(html`<i class="ion-compose"></i>&nbsp;New Article`, editorRoute)}
      </li>
      <li class="nav-item">
        ${NavLink(html`<i class="ion-gear-a"></i>&nbsp;Settings`, settingsRoute)}
      </li>
      <li class="nav-item">
        ${
  NavLink(
    html`<img src="${Fx.prepend(CurrentUserImage, null)}" class="user-pic" />${CurrentUsername}`,
    profileRoute,
    Fx.struct({ username: CurrentUsername })
  )
}
      </li>
    </ul>
  </div>
</nav>`
