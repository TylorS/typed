import { Pure } from '@typed/fp/Effect/exports'
import { createOp, Op, OpEnv, UriOf } from '@typed/fp/Op/exports'

import { Ref } from './Ref'

export interface SharedRef<Uri extends PropertyKey, A> extends Op<Uri, () => Pure<Ref<A>>> {}

export type SharedRefValue<A> = A extends SharedRef<any, infer R> ? R : never

export interface SharedRefEnv<A extends SharedRef<any, any>> extends OpEnv<A> {}

export const createSharedRef: <R extends SharedRef<any, any>>(uri: UriOf<R>) => R = createOp
