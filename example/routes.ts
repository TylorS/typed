import { pushState } from '../src/DOM/History'
import { makeRoute } from '../src/Router/Route'

import { isAuthenticated } from './services/AuthService'

export const fooRoute = makeRoute('/foo')

export const barRoute = makeRoute('/bar')

export const bazRoute = makeRoute('/baz')

export const quuxRoute = makeRoute('/quux/:something')

export const loginRoute = makeRoute('/login')

export const secretRoute = makeRoute('/secret').guard(
  () => isAuthenticated,
  () => pushState(loginRoute.path),
)
