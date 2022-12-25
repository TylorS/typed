import { pipe } from '@fp-ts/data/Function'
import { Main } from '@typed/framework/Module.js'

import * as Fx from '@typed/fx/index.js'
import * as Route from '@typed/route/index.js'

export const route = Route.home

export const main = Main.lazy(route)(() =>
  import('../components/counter-with-service.js').then(
    (m) => () => pipe(m.Counter, Fx.provideSomeLayer(m.layer('Home Counter'))),
  ),
)
