import type { Placeholder, RenderEvent, Route } from "@typed/core"
import { EventHandler, Fx, html, Navigation, RefSubject, Router } from "@typed/core"
import type { MatchInput } from "@typed/router"
import { asRouteGuard } from "@typed/router"
import { Effect } from "effect"

export function NavLink<E, R, I extends MatchInput.Any>(
  props: {
    content: Placeholder<string | RenderEvent, E, R>
    route: I
    relative?: boolean
  },
  ...params: Route.Route.ParamsList<MatchInput.Route<I>>
) {
  return Fx.gen(function*(_) {
    const { route } = asRouteGuard(props.route)
    const to = route.interpolate(params[0] ?? {})
    const isActive = Router.isActive<MatchInput.Route<I>>(route, ...params)
    const href = props.relative ? Router.makeHref(route, ...params) : yield* RefSubject.of(to)
    const className = RefSubject.when(isActive, { onFalse: "nav-link", onTrue: "nav-link active" })
    const onClick = EventHandler.preventDefault(() => Effect.flatMap(href, Navigation.navigate))

    return html`<li class="nav-item"><a href=${to} class=${className} onclick=${onClick}>${props.content}</a></li>`
  })
}
