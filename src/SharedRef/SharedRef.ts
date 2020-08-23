import { createOp, Op, OpEnv, ReturnOf, UriOf } from '@typed/fp/Op'
import { IORef } from 'fp-ts/es6/IORef'

export const SHARED_REF = Symbol('SharedRef')

export interface SharedRef<Uri, A> extends Op<Uri, () => IORef<A>> {}

export type SharedRefValue<A> = ReturnOf<A> extends IORef<infer R> ? R : never

export interface SharedRefEnv<A extends SharedRef<any, any>> extends OpEnv<A> {}

export const createSharedRef: <R extends SharedRef<any, any>>(uri: UriOf<R>) => R = createOp
