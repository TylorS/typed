import { Hkt } from './Hkt'
import { Env } from './Env'
import { URIS2, URIS3, URIS4 } from 'fp-ts/HKT'

export type FromEnv<F> = {
  readonly fromEnv: <E, A>(resume: Env<E, A>) => Hkt<F, [E, A]>
}

export type FromEnv2<F extends URIS2> = {
  readonly fromEnv: <E, A>(resume: Env<E, A>) => Hkt<F, [E, A]>
}

export type FromEnv3<F extends URIS3> = {
  readonly fromEnv: <R, A, E = never>(resume: Env<R, A>) => Hkt<F, [R, E, A]>
}

export type FromEnv4<F extends URIS4> = {
  readonly fromEnv: <R, A, S = unknown, E = never>(resume: Env<R, A>) => Hkt<F, [S, R, E, A]>
}
