import { deepEqualsEq, Eq } from '@fp/Eq'
import { Do } from '@fp/Fx/Env'
import { tuple } from 'fp-ts/Eq'

import { useEq } from './useEq'

export type DepsArgs<A extends ReadonlyArray<any>> = readonly [
  deps?: A,
  eqs?: { readonly [K in keyof A]: Eq<A[K]> },
]

export const defaultDeps = <A extends ReadonlyArray<any>>(): A => [] as any

export const defaultEqs = <A extends ReadonlyArray<any>>(
  deps: A,
): { readonly [K in keyof A]: Eq<A[K]> } => deps.map(() => deepEqualsEq) as any

export const getDeps = <A extends ReadonlyArray<any>>([
  deps = defaultDeps<A>(),
  eqs = defaultEqs(deps),
]: DepsArgs<A>): readonly [deps: A, eqs: { readonly [K in keyof A]: Eq<A[K]> }] => [deps, eqs]

export const useDeps = <A extends ReadonlyArray<any>>(...args: DepsArgs<A>) =>
  Do(function* (_) {
    const [deps, eqs] = getDeps(args)
    return yield* _(useEq(deps, tuple(...eqs)))
  })
