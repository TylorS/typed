import { Disposable } from '@typed/fp/Disposable'
import { Arity1 } from '../common'

export interface Effect<E, A> extends Arity1<E, EffectCb<A>> {}
export interface EffectCb<A> extends Arity1<Arity1<A, Disposable>, Disposable> {}

export type PureEffect<A> = <E>(_: E) => EffectCb<A>

export type EnvOf<A> = A extends Effect<infer R, any> ? R : never
export type ValueOf<A> = A extends Effect<any, infer R> ? R : never

export const noEnv = <A>(value: A): PureEffect<A> => <E>(_: E) => (f: Arity1<A, Disposable>) =>
  f(value)
