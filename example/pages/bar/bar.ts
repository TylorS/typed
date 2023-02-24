import { range } from '@effect/data/ReadonlyArray'
import { sync } from '@effect/io/Effect'
import { Main } from '@typed/framework'
import { html } from '@typed/html'
import * as Route from '@typed/route'
import { Link, outlet } from '@typed/router'

import { Counter } from '../../components/counter-with-service.js'

export const route = Route.Route('/bar/:bar')

export const main = Main.make(route)(() => Counter)

export const layout = html`
  <div>
    <h1>Bar Layout</h1>

    <nav>
      ${
        // Links can be configured with "useBase: false" to avoid pre-prending the current base path
        Link({ href: '/', label: 'Go Back', useBase: false })
      }
    </nav>

    <main>${outlet}</main>
  </div>
`

export const getStaticPaths = sync(() => range(0, 10).map((i) => route.make({ bar: i.toString() })))
