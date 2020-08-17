import { Disposable } from '@most/types'
import { Eq, eqStrict } from 'fp-ts/lib/Eq'
import { getEq } from 'fp-ts/lib/ReadonlyArray'

import { async, Effect, FiberEnv, fromEnv } from '../Effect'
import { Fn } from '../lambda'
import { HookEnv } from './HookEnvironment'
import { useFiber } from './useFiber'

const EMPTY_ARRAY: ReadonlyArray<any> = []
const STRICT_ARRAY_EQ = getEq(eqStrict)

export function useDisposable<A extends ReadonlyArray<any>>(
  f: Fn<A, Disposable>,
  deps: A = EMPTY_ARRAY as A,
  eq: Eq<A> = STRICT_ARRAY_EQ,
): Effect<HookEnv & FiberEnv, Disposable> {
  return useFiber((...args) => fromEnv(() => async(() => f(...args))), deps, eq)
}
