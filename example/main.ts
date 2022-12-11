import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { html } from '../src/HTML/index.js'
import { homeRoute } from '../src/Router/Route.js'
import * as Router from '../src/Router/Router.js'

import { barRoute, bazRoute, fooRoute, loginRoute, quuxRoute, secretRoute } from './routes.js'
import { AuthService } from './services/AuthService.js'
import { template404 } from './templates/404.js'
import { bar } from './templates/Bar.js'
import { baz } from './templates/Baz.js'
import { foo } from './templates/Foo.js'
import { home } from './templates/home.js'
import { login } from './templates/login.js'
import { navigation } from './templates/navigation.js'
import { quux } from './templates/quux.js'
import { secret } from './templates/secret.js'

export const mainUrl = new URL(import.meta.url)

export const main = Fx.fromFxGen(function* ($) {
  const isAuthenticated = yield* $(Fx.makeRefSubject(() => false))

  return html`<div>
    <h1>App Shell</h1>

    ${navigation(isAuthenticated)}
    ${pipe(
      Router.match(fooRoute, () => foo)
        .match(barRoute, () => bar)
        .match(bazRoute, () => baz)
        .match(quuxRoute, quux)
        .match(loginRoute, () => login(isAuthenticated))
        .match(secretRoute, () => secret)
        .match(homeRoute, () => home)
        .noMatch(() => template404),
      Fx.provideService(AuthService, { isAuthenticated: isAuthenticated.get }),
    )}
  </div>`
})
