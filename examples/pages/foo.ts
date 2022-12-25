import { pipe } from '@fp-ts/data/Function'
import { Main } from '@typed/framework/index.js'

import * as Fx from '@typed/fx/index.js'
import { html } from '@typed/html/index.js'
import * as Route from '@typed/route/index.js'

export const route = Route.Route('/:foo')

const program = (params: Main.ParamsOf<typeof route>) =>
  html`<h2>
    ${pipe(
      params,
      Fx.map((x) => x.foo),
    )}
  </h2>`

export const main = Main.make(route)(program)
