import { LocalScope, Scope } from './Scope'

export const extendScope = <E, A, E2 = E, B = A>(parentScope: Scope<E, A>) => {
  const local = new LocalScope<E2, B>()

  if (!local.extend(parentScope)) {
    const err = new Error('Unable to extend parent scope')

    Error.captureStackTrace(err)

    console.warn(err)
  }

  return local
}
