import { pipe } from '@effect/data/Function'
import { range } from '@effect/data/ReadonlyArray'
import { sync } from '@effect/io/Effect'
import { Main } from '@typed/framework'
import * as Fx from '@typed/fx'
import * as Route from '@typed/route'

export const route = Route.Route('/foo/:foo')

// Any exported Fx, or Fx-returning function can easily be lazy loaded
export const main = Main.lazy(route)(() =>
  import('../../components/counter-with-service.js').then(
    (m): Main<never, never, typeof route> =>
      Fx.switchMap(({ foo }: Route.ParamsOf<typeof route>) =>
        pipe(m.Counter, Fx.provideSomeLayer(m.layer('Foo: ' + foo))),
      ),
  ),
)

export const getStaticPaths = sync(() => range(0, 10).map((i) => route.make({ foo: i.toString() })))
