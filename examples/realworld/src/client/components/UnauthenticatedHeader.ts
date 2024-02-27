import { homeRoute, loginRoute, registerRoute } from "@/client/routes"
import { html } from "@typed/template"
import { Link } from "@typed/ui"
import { NavLink } from "./NavLink"

export const UnauthenticatedHeader = html`<nav class="navbar navbar-light">
  <div class="container">
    ${
  Link(
    {
      to: homeRoute.path,
      className: "navbar-brand"
    },
    "conduit"
  )
}
    <ul class="nav navbar-nav pull-xs-right">
      <li class="nav-item">
        ${NavLink("Home", homeRoute)}
      </li>
      <li class="nav-item">
        ${NavLink("Sign in", loginRoute)}
      </li>
      <li class="nav-item">
        ${NavLink("Sign up", registerRoute)}
      </li>
    </ul>
  </div>
</nav>`
