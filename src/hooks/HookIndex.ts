import { of } from '@fp/Env'
import { alwaysEqualsEq } from '@fp/Eq'
import { Do } from '@fp/Fx/Env'
import { createRef } from '@fp/Ref'
import { increment } from 'fp-ts/function'

const INITIAL = 0

/**
 * The current index at which to find a hook references
 */
export const HookIndex = createRef(of(INITIAL), Symbol('HookIndex'), alwaysEqualsEq)

export const getNextIndex = Do(function* (_) {
  const index = yield* _(HookIndex.get)

  yield* _(HookIndex.modify(increment))

  return index
})

export const resetIndex = HookIndex.set(INITIAL)
