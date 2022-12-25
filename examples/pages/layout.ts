import { html } from '@typed/html/index.js'
import { outlet } from '@typed/router/index.js'

export const layout = html`<div>
  <h1>Layout</h1>

  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/foo">Foo</a></li>
      <li><a href="/bar">Bar</a></li>
      <li><a href="/baz">Baz</a></li>
    </ul>
  </nav>

  ${outlet}
</div>`
