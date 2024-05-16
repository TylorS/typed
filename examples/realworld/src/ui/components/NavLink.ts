import type { Navigation, Placeholder, RenderEvent, Route } from "@typed/core"
import { html, Link, RefSubject, Router } from "@typed/core"
import type { MatchInput } from "@typed/router"
import { asRouteGuard } from "@typed/router"

export function NavLink<E, R, I extends MatchInput.Any, E2 = never, R2 = never>(
  props: {
    content: Placeholder<string | RenderEvent, E, R>
    route: I
    relative?: boolean
    isActive?: RefSubject.Computed<boolean, E2, R2>
  },
  ...params: Route.Route.ParamsList<MatchInput.Route<I>>
) {
  const { route } = asRouteGuard(props.route)
  const to = route.interpolate(params[0] ?? {})
  const isActive: RefSubject.Computed<boolean, E2, R2 | Navigation.Navigation | Router.CurrentRoute> = props.isActive ??
    Router.isActive<MatchInput.Route<I>>(route, ...params)
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
