import { ask, chain, Env, fromIO, useAll } from '@fp/Env'
import { deepEqualsEq } from '@fp/Eq'
import { CurrentFiber, usingFiberRefs } from '@fp/Fiber'
import { Arity1, constant, flow, pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { getRef, Ref, Refs, setRef } from '@fp/Ref'
import { Eq } from 'fp-ts/Eq'

import { useMemo } from './useMemo'
import { useRef } from './useRef'

export const useState = <E, A>(
  initial: Env<E, A>,
  eq: Eq<A> = deepEqualsEq,
): Env<CurrentFiber & E, readonly [value: A, update: (update: Arity1<A, A>) => Env<unknown, A>]> =>
  usingFiberRefs(
    Do(function* (_) {
      const ref = yield* _(useRef(initial, eq))
      const value = yield* _(getRef(ref))
      const env = yield* _(ask<E & Refs>())
      const updateValue = yield* pipe(ref, modifyRef(env), constant, fromIO, useMemo, _)

      return [value, updateValue] as const
    }),
  )

// Takes in the environemnt just in case this is called in another environment
// where the reference has been passed along
function modifyRef<E>(env: E & Refs) {
  return <A>(ref: Ref<E, A>) => (update: Arity1<A, A>) =>
    pipe(ref, getRef, chain(flow(update, setRef(ref))), useAll(env))
}
