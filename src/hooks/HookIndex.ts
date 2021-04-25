import { of } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { createRef, getRef, setRef_ } from '@fp/Ref'

/**
 * The current index at which to find a hook references
 */
export const HookIndex = createRef(of(0), Symbol('HookIndex'), alwaysEqualsEq)

export const getNextIndex = Do(function* (_) {
  const index = yield* _(getRef(HookIndex))

  yield* pipe(HookIndex, setRef_(index + 1), _)

  return index
})

export const resetIndex = pipe(HookIndex, setRef_(0))
