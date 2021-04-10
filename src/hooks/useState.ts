import { ask, Env, fromIO, useAll } from '@fp/Env'
import { deepEqualsEq } from '@fp/Eq'
import { constant, pipe } from '@fp/function'
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
    const setValue = yield* pipe(ref, setRefWith(env), constant, fromIO, useMemo, _)

    return [value, setValue] as const
  })

// Takes in the environemnt just in case this is called in another environment
// where the reference has been passed along
function setRefWith<E>(env: E & Refs) {
  return <A>(ref: Ref<E, A>) => (value: A): Env<unknown, A> => pipe(ref, setRef(value), useAll(env))
}
