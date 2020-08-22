import { createOp, Op, OpEnv, ReturnOf, UriOf } from '@typed/fp/Op'
import { IO } from 'fp-ts/es6/IO'
import { IORef } from 'fp-ts/es6/IORef'

export const REF = Symbol('REF')

export interface Ref<Uri, A> extends Op<Uri, IO<IORef<A>>> {}

export type RefValue<A> = ReturnOf<A> extends IORef<infer R> ? R : never

export interface RefEnv<A extends Ref<any, any>> extends OpEnv<A> {}

export const createRef: <R extends Ref<any, any>>(uri: UriOf<R>) => R = createOp
