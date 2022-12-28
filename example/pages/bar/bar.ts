import { Main } from '@typed/framework'
import { html } from '@typed/html'
import * as Route from '@typed/route'
import { outlet } from '@typed/router'

import { Counter, layer } from '../../components/counter-with-service.js'

export const route = Route.Route('/bar/:bar')

export const main = Main.make(route)(() => Counter)

export const environment: Main.LayerOf<typeof main> = layer('Counter')

export const layout = html`
  <div>
    <h1>Bar</h1>

    <div>
      <a href="/">Go Back</a>
    </div>

    <main>${outlet}</main>
  </div>
`
