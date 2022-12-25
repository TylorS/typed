import { pipe } from '@fp-ts/data/Function'
import { Main } from '@typed/framework/Module.js'

import * as Fx from '@typed/fx/index.js'
import * as Route from '@typed/route/index.js'

export const route = Route.Route('/foo/:foo')

// Any exported Fx, or Fx-returning function can easily be lazy loaded
export const main = Main.lazy(route)(() =>
  import('../../components/counter-with-service.js').then(
    (m) => (params: Main.ParamsOf<typeof route>) =>
      pipe(
        params,
        Fx.switchMap(({ foo }) => pipe(m.Counter, Fx.provideSomeLayer(m.layer('Foo: ' + foo)))),
      ),
  ),
)
