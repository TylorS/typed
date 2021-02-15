import { Fx } from '@fp/Fx'
import { Either } from 'fp-ts/Either'

export interface FxEither<Effects, E, A, N = unknown> extends Fx<Effects, Either<E, A>, N> {}

export interface PureEither<E, A> extends FxEither<never, E, A> {}

export type GetLeft<A> = A extends FxEither<any, infer R, any, any> ? R : never

export type GetRight<A> = A extends FxEither<any, any, infer R, any> ? R : never
