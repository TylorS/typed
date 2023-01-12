import { html } from '@typed/html'
import { Link, outlet } from '@typed/router'

import * as bar from './bar/bar.js'
import * as foo from './foo/foo.js'

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
      <li>${Link({ href: '/', label: 'Home' })}</li>
      <li>${Link({ href: foo.route.make({ foo: '1' }), label: 'Foo 1' })}</li>
      <li>${Link({ href: foo.route.make({ foo: '2' }), label: 'Foo 2' })}</li>
      <li>${Link({ href: bar.route.make({ bar: '1' }), label: 'Bar 1' })}</li>
      <li>${Link({ href: bar.route.make({ bar: '2' }), label: 'Bar 2' })}</li>
      <li><a href="/other">Other</a></li>
      <li>${Link({ href: '/broken-link', label: 'Broken' })}</li>
    </ul>
  </nav>

  ${outlet}
`

// ----------------------------------------------

// Optionally a layout can expose an environment to provide resources

// export const environment: Layer<IntrinsicServices, never, ResourcesOfLayout> = ...
