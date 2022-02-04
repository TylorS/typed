import { flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'

import * as FiberRef from '@/FiberRef'
import { findProvider } from '@/FiberRef'
import { withProvider } from '@/FiberRef/withProvider'
import * as Ref from '@/Ref'
import * as Stream from '@/Stream'

/**
 * Context is a special instance of Ref which will use the FiberContext tree to find where to
 * share state within, traveling up the tree until finding the first FiberContext to hold that FiberRef.
 * If no FiberContext holds a reference, the root-most FiberContext will be utilized.
 */
export interface Context<R, E, A> extends Ref.Ref<R, E, A> {}

export function fromFiberRef<R, E, A>(ref: FiberRef.FiberRef<R, E, A>): Context<R, E, A> {
  // Type-cast error from never to E since it's safe to never throw an Expected error.
  const values = FiberRef.values(ref) as unknown as Stream.Stream<unknown, E, Option<A>>

  return {
    get: pipe(ref, FiberRef.get, withProvider(ref)),
    has: pipe(ref, FiberRef.has, withProvider(ref)),
    update: (a) => pipe(ref, FiberRef.update(a), withProvider(ref)),
    delete: pipe(ref, FiberRef.delete, withProvider(ref)),
    values: pipe(
      Stream.fromFx(findProvider(ref)),
      Stream.chain((c) => pipe(values, Stream.withinContext(c))),
    ),
  }
}

export const make = flow(FiberRef.make, fromFiberRef)
