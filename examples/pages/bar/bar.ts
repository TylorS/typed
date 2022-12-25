import { pipe } from '@fp-ts/data/Function'
import { Main } from '@typed/framework/Module.js'

import * as Fx from '@typed/fx/index.js'
import { html } from '@typed/html/index.js'
import * as Route from '@typed/route/index.js'
import { outlet } from '@typed/router/router.js'

export const route = Route.Route('/bar/:bar')

export const main = Main.lazy(route)(() =>
  import('../../components/counter-with-service.js').then(
    (m) => (params: Main.ParamsOf<typeof route>) =>
      pipe(
        params,
        Fx.switchMap(({ bar }) => pipe(m.Counter, Fx.provideSomeLayer(m.layer('Bar: ' + bar)))),
      ),
  ),
)

export const layout = html`
  <div>
    <h1>Bar</h1>

    <div>
      <a href="/">Go Back</a>
    </div>

    <main>${outlet}</main>
  </div>
`
