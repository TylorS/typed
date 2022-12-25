import { html } from '@typed/html/index.js'
import { outlet } from '@typed/router/index.js'

export const layout = html`<div>
  <h1>Layout</h1>

  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/foo/1">Foo 1</a></li>
      <li><a href="/foo/2">Foo 2</a></li>
      <li><a href="/bar/1">Bar 1</a></li>
      <li><a href="/bar/2">Bar 2</a></li>
      <li><a href="/broken-link">Broken</a></li>
    </ul>
  </nav>

  ${outlet}
</div>`

// Optionally a layout can expose an environment to provide resources

// export const environment: Layer<IntrinsicServices, never, ResourcesOfLayout> = ...
