import { LocalScope, Scope } from './Scope'

export const extendScope = <E, A, E2 = E, B = A>(parentScope: Scope<E, A>) => {
  const local = new LocalScope<E2, B>()

  local.extend(parentScope)

  return local
}
