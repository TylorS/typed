import type { Placeholder, RenderEvent, Route } from "@typed/core"
import { html, Link, RefSubject, Router } from "@typed/core"
import type { MatchInput } from "@typed/router"
import { asRouteGuard } from "@typed/router"

export function NavLink<E, R, I extends MatchInput.Any>(
  props: {
    content: Placeholder<string | RenderEvent, E, R>
    route: I
    relative?: boolean
  },
  ...params: Route.Route.ParamsList<MatchInput.Route<I>>
) {
  const { route } = asRouteGuard(props.route)
  const to = route.interpolate(params[0] ?? {})
  const isActive = Router.isActive<MatchInput.Route<I>>(route, ...params)
  const className = RefSubject.when(isActive, { onFalse: "nav-link", onTrue: "nav-link active" })

  return html`<li class="nav-item">
    ${
    Link(
      {
        to,
        className,
        relative: props.relative ?? false
      },
      props.content
    )
  }
  </li>`
}
