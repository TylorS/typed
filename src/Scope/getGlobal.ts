import { GlobalScope, Scope } from './Scope'

export function getGlobal<R, A>(scope: Scope<R, A>): GlobalScope {
  if (scope.type === 'Global') {
    return scope
  }

  return scope.global
}
