import { Option } from 'fp-ts/Option'

import { Cancelable } from '@/Cancelable'
import { FiberRef } from '@/FiberRef'

import * as Fx from './Fx'

export interface Scope extends Cancelable {
  // References
  readonly references: FiberLocalState<any, any>
  readonly cloneReferences: () => FiberLocalState<any, any>
  readonly inheritRefs: (toInherit: FiberLocalState<any, any>) => void
  readonly getFiberRef: <A>(ref: FiberRef<A>) => Fx.Fx<unknown, A>
  readonly updateFiberRef: <A, R>(ref: FiberRef<A>, f: (value: A) => Fx.Fx<R, A>) => Fx.Fx<R, A>
  readonly deleteFiberRef: <A>(ref: FiberRef<A>) => Fx.Fx<unknown, Option<A>>

  // Resources
  readonly cancel: Cancelable['cancel']
  readonly trackResources: (...cancelables: readonly Cancelable[]) => Cancelable
  readonly isClosed: () => boolean
}

export interface FiberLocalState<K, V> extends Map<K, FiberRefState<V>> {}

export interface FiberRefState<A> {
  readonly value: A
  readonly fork: (a: A) => A
  readonly join: (left: A, right: A) => A
}
