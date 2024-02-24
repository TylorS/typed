import { html } from "@typed/template"
import { Link } from "@typed/ui"
import { homeRoute } from "../routes"

export const Footer = html`<footer>
  <div class="container">
    ${
  Link(
    {
      to: homeRoute.path,
      className: "logo-font"
    },
    "conduit"
  )
}
    <span class="attribution">
      An interactive learning project from <a href="https://thinkster.io">Thinkster</a>. Code &amp;
      design licensed under MIT.
    </span>
  </div>
</footer>`
