import * as Fx from '@typed/fx/index.js'
import { html } from '@typed/html/index.js'
import { Router } from '@typed/router/index.js'

export const layout = Fx.gen(function* ($) {
  const router = yield* $(Router.get)

  return html`<div>
    <h1>Layout</h1>

    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/foo/1">Foo 1</a></li>
        <li><a href="/foo/2">Foo 2</a></li>
        <li><a href="/bar/1">Bar 1</a></li>
        <li><a href="/bar/2">Bar 2</a></li>
      </ul>
    </nav>

    ${router.outlet}
  </div>`
})
