import { Pure } from '@typed/fp/Effect'
import { createOp, Op, OpEnv, UriOf } from '@typed/fp/Op'
import { IORef } from 'fp-ts/es6/IORef'

export const SHARED_REF = Symbol('@typed/fp/hooks/SharedRef')

export interface SharedRef<Uri, A> extends Op<Uri, () => Pure<IORef<A>>> {}

export type SharedRefValue<A> = A extends SharedRef<any, infer R> ? R : never

export interface SharedRefEnv<A extends SharedRef<any, any>> extends OpEnv<A> {}

export const createSharedRef: <R extends SharedRef<any, any>>(uri: UriOf<R>) => R = createOp
