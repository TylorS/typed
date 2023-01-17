import { Main } from '@typed/framework'
import { dieMessage } from '@typed/fx'
import { html } from '@typed/html'
import * as Route from '@typed/route'
import { Link, outlet } from '@typed/router'

// import { Counter } from '../../components/counter-with-service.js'

export const route = Route.Route('/bar/:bar')

export const main = Main.make(route)(() => dieMessage('Not implemented yet'))

export const layout = html`
  <div>
    <h1>Bar</h1>

    <nav>
      ${
        // Links can be configured with "useBase: false" to avoid pre-prending the current base path
        Link({ href: '/', label: 'Go Back', useBase: false })
      }
    </nav>

    <main>${outlet}</main>
  </div>
`
