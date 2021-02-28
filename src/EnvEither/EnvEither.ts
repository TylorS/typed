import { Env } from '@typed/fp/Env'
import { Either } from 'fp-ts/dist/Either'

export interface EnvEither<R, E, A> extends Env<R, Either<E, A>> {}

export type GetRequirements<A> = [A] extends [EnvEither<infer R, any, any>] ? R : never

export type GetLeft<A> = [A] extends [EnvEither<any, infer R, any>] ? R : never

export type GetRight<A> = [A] extends [EnvEither<any, any, infer R>] ? R : never
