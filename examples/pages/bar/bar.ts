import { pipe } from '@fp-ts/data/Function'
import { Main } from '@typed/framework/Module.js'

import { Counter, layer } from '../../components/counter-with-service.js'

import * as Fx from '@typed/fx/index.js'
import { html } from '@typed/html/index.js'
import * as Route from '@typed/route/index.js'
import { outlet } from '@typed/router/router.js'

export const route = Route.Route('/bar/:bar')

export const main = Main.make(route)((params) =>
  pipe(
    params,
    Fx.switchMap(({ bar }) => pipe(Counter, Fx.provideSomeLayer(layer(`Bar ${bar}`)))),
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
