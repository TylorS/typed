import { pipe } from '@fp-ts/data/Function'
import * as Fx from '@typed/fx'

import { html } from '../../src/HTML'
import { homeRoute } from '../../src/Router/Route'
import { barRoute, bazRoute, fooRoute, loginRoute, quuxRoute, secretRoute } from '../routes'

export function navigation(isAuthenticated: Fx.Fx<never, never, boolean>) {
  return html` <nav>
    <ul>
      <li><a href="${homeRoute.path}">Home</a></li>
      <li><a href="${fooRoute.path}">Foo</a></li>
      <li><a href="${barRoute.path}">Bar</a></li>
      <li><a href="${bazRoute.path}">Baz</a></li>
      <li><a href="${quuxRoute.createPath({ something: 'hello' })}">Hello</a></li>
      <li><a href="${quuxRoute.createPath({ something: 'world' })}">World</a></li>
      <li><a href="${loginRoute.path}">Login</a></li>
      ${pipe(
        isAuthenticated,
        Fx.switchMap((isAuthenticated) =>
          isAuthenticated ? html`<li><a href="${secretRoute.path}">Secret</a></li>` : html``,
        ),
      )}
    </ul>
  </nav>`
}
