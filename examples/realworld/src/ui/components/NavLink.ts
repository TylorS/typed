import type { Path, Placeholder, RenderEvent } from "@typed/core"
import { EventHandler, Fx, html, Navigation, Route, Router } from "@typed/core"

export function NavLink<E, R, P extends string, A = Path.ParamsOf<P>, E2 = never, R2 = never>(
  content: Placeholder<string | RenderEvent, E, R>,
  input: Route.RouteInput<P, A, E2, R2>,
  ...params: Path.ParamsList<P>
) {
  const { route } = Route.asRouteGuard(input)
  const to = route.make(...params)
  const isActive = Router.isActive(route, ...params)
  const className = Fx.when(isActive, {
    onFalse: "nav-link",
    onTrue: "nav-link active"
  })

  return html`<li class="nav-item">
    <a
      class="${className}" 
      href="${to}"
      onclick="${EventHandler.preventDefault(() => Navigation.navigate(to))}">
      ${content}
    </a>
  </li>`
}
