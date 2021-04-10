import { of } from '@fp/Env'
import { Do } from '@fp/Fx/Env'
import { createRef, getRef, setRef } from '@fp/Ref'
import { pipe } from 'cjs/function'

export const HookIndex = createRef(of(0), Symbol('HookIndex'))

export const getNextIndex = Do(function* (_) {
  const index = yield* _(getRef(HookIndex))

  yield* pipe(HookIndex, setRef(index + 1), _)

  return index
})
