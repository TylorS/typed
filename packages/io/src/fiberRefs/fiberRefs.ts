import { Option } from '@fp-ts/data/Option'

import { Effect } from '../effect/Effect.js'
import { FiberRef } from '../fiberRef/fiberRef.js'
import { Fx } from '../fx/Fx.js'

export interface FiberRefs {
  readonly getReferences: () => ReadonlyMap<FiberRef<any, any, any>, any>
  readonly getOption: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Option<A>
  readonly get: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Effect<R, E, A>
  readonly set: <R, E, A>(fiberRef: FiberRef<R, E, A>, a: A) => Effect<never, never, void>
  readonly modify: <R, E, A, B>(
    fiberRef: FiberRef<R, E, A>,
    f: (a: A) => readonly [B, A],
  ) => Effect<R, E, B>
  readonly delete: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Effect<never, never, Option<A>>
  readonly subscribe: <R, E, A>(fiberRef: FiberRef<R, E, A>) => Fx<R, E, A>
}
