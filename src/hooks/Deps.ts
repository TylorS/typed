import { deepEqualsEq, Eq } from '@fp/Eq'
import { tuple } from 'fp-ts/Eq'

export type DepsArgs<A extends ReadonlyArray<any>> = readonly [
  deps?: A,
  eqs?: { readonly [K in keyof A]: Eq<A[K]> },
]

export const defaultDeps = <A extends ReadonlyArray<any>>(): A => [] as any

export const defaultEqs = <A extends ReadonlyArray<any>>(
  deps: A,
): { readonly [K in keyof A]: Eq<A[K]> } => tuple(...deps.map(() => deepEqualsEq)) as any

export const getDeps = <A extends ReadonlyArray<any>>([
  deps = defaultDeps<A>(),
  eqs = defaultEqs(deps),
]: DepsArgs<A>): readonly [deps: A, eqs: { readonly [K in keyof A]: Eq<A[K]> }] => [deps, eqs]
