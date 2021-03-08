import { HKT, URIS2, Kind2, URIS3, Kind3, URIS4, Kind4 } from 'fp-ts/dist/HKT'
import { RuntimeEnv } from '@typed/fp/Shared'

export type UseState<F, A, B = A> = readonly [() => A, (updated: B) => HKT<F, A>]

export type UseState2<F extends URIS2, A, B = A> = readonly [
  () => A,
  (updated: B) => Kind2<F, RuntimeEnv<F>, B>,
]

export type UseState3<F extends URIS3, A, B = A, E = never> = readonly [
  () => A,
  (updated: B) => Kind3<F, RuntimeEnv<F>, E, B>,
]

export type UseState4<F extends URIS4, A, B = A, S = unknown, E = never> = readonly [
  () => A,
  (updated: B) => Kind4<F, S, RuntimeEnv<F>, E, B>,
]
