import { html } from '@typed/html'
import { Link, outlet } from '@typed/router'

import * as react from './react/counter.jsx'
import * as svelte from './svelte/svelte.js'

// A layout is applied to all pages that don't have a layout specified in the same directory
// or child directories. If a layout is specified in a child directory, or a module, it will be used
// instead of rather than in addition to the layout in the parent directory.
//
// A layout module is found via any file ending in "layout.[js|ts]x?" and must export an Fx
// at the name "layout"

export const layout = html`
  <h1>Layout</h1>

  <nav>
    <ul>
      <li>${Link({ href: '/', label: 'Home', fullReload: true })}</li>
      <li>${Link({ href: react.route.make({ counter: 'foo' }), label: 'React Foo' })}</li>
      <li>${Link({ href: react.route.make({ counter: 'bar' }), label: 'React Bar' })}</li>
      <li>${Link({ href: svelte.route.make({ name: 'foo' }), label: 'Svelte Foo' })}</li>
      <li>${Link({ href: svelte.route.make({ name: 'bar' }), label: 'Svelte Bar' })}</li>
      <li>${Link({ href: '/broken-link', label: 'Broken' })}</li>
    </ul>
  </nav>

  ${outlet}
`

// ----------------------------------------------

// Optionally a layout can expose an environment to provide resources

// export const environment: Layer<IntrinsicServices, never, ResourcesOfLayout> = ...
