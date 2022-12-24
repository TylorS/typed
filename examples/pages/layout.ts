import { log } from '@effect/io/Effect'

import * as Fx from '@typed/fx/index.js'
import { html } from '@typed/html/index.js'
import { outlet } from '@typed/router/router.js'

// TODO: Layouts should be updated to not remount on route changes

export const layout = Fx.gen(function* ($) {
  yield* $(log('layout mounting'))

  return html`<div>
    <h1>Layout</h1>

    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/foo">Foo</a></li>
      </ul>
    </nav>

    ${outlet}
  </div>`
})
