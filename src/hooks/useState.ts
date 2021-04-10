import { ask, chain, Env, fromIO, useAll } from '@fp/Env'
import { deepEqualsEq } from '@fp/Eq'
import { Arity1, constant, pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { createRef, getRef, Ref, Refs, setRef } from '@fp/Ref'
import { Eq } from 'fp-ts/Eq'

import { getNextSymbol } from './internal/HookSymbols'
import { useMemo } from './useMemo'

export const useState = <E, A>(initial: Env<E, A>, eq: Eq<A> = deepEqualsEq) =>
  Do(function* (_) {
    const symbol = yield* _(getNextSymbol)
    const ref = createRef(initial, symbol, eq)
    const value = yield* _(getRef(ref))
    const env = yield* _(ask<E & Refs>())
    const updateValue = yield* pipe(ref, modifyRef(env), constant, fromIO, useMemo, _)

    return [value, updateValue] as const
  })

// Takes in the environemnt just in case this is called in another environment
// where the reference has been passed along
function modifyRef<E>(env: E & Refs) {
  return <A>(ref: Ref<E, A>) => (update: Arity1<A, A>) =>
    pipe(
      ref,
      getRef,
      chain((a) => pipe(ref, pipe(a, update, setRef))),
      useAll(env),
    )
}
