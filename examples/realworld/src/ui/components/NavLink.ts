import type { RenderEvent, Route } from "@typed/core"
import { Fx, html, Link, Placeholder, Router } from "@typed/core"
import type { MatchInput } from "@typed/router"
import { asRouteGuard } from "@typed/router"

type NavLinkRouteParams<I extends MatchInput.Any, E2, R2> =
  | Route.Route.ParamsList<MatchInput.Route<I>>
  | [Fx.Fx<Route.Route.Params<MatchInput.Route<I>>, E2, R2>]

export function NavLink<E, R, I extends MatchInput.Any, E2 = never, R2 = never>(
  content: Placeholder<string | RenderEvent, E, R>,
  input: I,
  ...params: NavLinkRouteParams<I, E2, R2>
) {
  return Fx.gen(function*(_) {
    const { route } = asRouteGuard(input)
    const paramsRef = yield* Placeholder.asRef((params[0] ?? {}) as Route.Route.Params<MatchInput.Route<I>>)
    const to = Fx.map(paramsRef, (params) => route.interpolate(params))
    const isActive = Fx.switchMap(paramsRef, (params) => Router.isActive<MatchInput.Route<I>>(route, params))
    const className = Fx.when(isActive, {
      onFalse: "nav-link",
      onTrue: "nav-link active"
    })

    return html`<li class="nav-item">
    ${
      Link(
        {
          to,
          className
        },
        content
      )
    }
  </li>`
  })
}
