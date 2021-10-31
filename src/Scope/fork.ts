import { pipe } from 'fp-ts/function'

import { extend } from './extend'
import { makeLocalScope } from './make'
import { LocalScope } from './Scope'

export function fork<R, A>(scope: LocalScope<R, any>): LocalScope<R, A> {
  const local = makeLocalScope<R, A>(scope.requirements, {
    parent: scope,
    global: scope.global,
  })

  pipe(scope, extend(local))

  return local
}
