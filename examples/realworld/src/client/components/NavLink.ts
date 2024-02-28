import * as Fx from "@typed/fx"
import type { ParamsOf } from "@typed/path"
import type { Route } from "@typed/route"
import * as Router from "@typed/router"
import type { Renderable } from "@typed/template"
import { Placeholder } from "@typed/template"
import { Link } from "@typed/ui"

export function NavLink<
  Content extends Renderable<any, any>,
  P extends string,
  Params extends ParamsOf<P> | Placeholder.Any<ParamsOf<P>>
>(
  text: Content,
  route: Route<P>,
  ...[params]: [keyof ParamsOf<P>] extends [never] ? [{}?] : [Params]
) {
  return Fx.gen(function*(_) {
    const paramsRef: Fx.RefSubject.RefSubject<ParamsOf<P>> = yield* _(Placeholder.asRef((params || {}) as ParamsOf<P>))
    const isActive = Fx.switchMap(paramsRef, (params) => Router.isActive(route, params))
    const to = Fx.map(paramsRef, (p) => route.make(p))

    return Link(
      {
        to,
        className: Fx.when(isActive, {
          onFalse: "nav-link",
          onTrue: "nav-link active"
        })
      },
      text
    )
  })
}
