import { Fn } from '@typed/fp/lambda'
import { Eq, eqStrict } from 'fp-ts/es6/Eq'
import { IO } from 'fp-ts/es6/IO'
import { getEq } from 'fp-ts/es6/ReadonlyArray'

import { doEffect, Effect } from '../Effect'
import { HookEnv } from './HookEnvironment'
import { useHasChanged } from './useHasChanged'
import { useRef } from './useRef'

const EMPTY_ARRAY: ReadonlyArray<any> = []
const STRICT_ARRAY_EQ = getEq(eqStrict)

export function useMemo<A>(io: IO<A>): Effect<HookEnv, A>
export function useMemo<A extends ReadonlyArray<any>, B>(fn: Fn<A, B>, args: A): Effect<HookEnv, B>
export function useMemo<A extends ReadonlyArray<any>, B>(
  fn: Fn<A, B>,
  args: A,
  eq: Eq<A>,
): Effect<HookEnv, B>

export function useMemo<A extends ReadonlyArray<any>, B>(
  fn: Fn<A, B>,
  args: A = EMPTY_ARRAY as A,
  eq: Eq<A> = STRICT_ARRAY_EQ,
): Effect<HookEnv, B> {
  const getRef = useRef(Effect.fromIO(() => fn(...args)))
  const checkHasChanged = useHasChanged(args, false, eq)

  return doEffect(function* () {
    const ref = yield* getRef
    const hasChanged = yield* checkHasChanged

    if (hasChanged) {
      ref.write(fn(...args))()
    }

    return ref.read()
  })
}
