import { flow, pipe } from 'fp-ts/function'

import * as FiberRef from '@/FiberRef'
import { findProvider } from '@/FiberRef'
import { withProvider } from '@/FiberRef/withProvider'
import * as Ref from '@/Ref'
import * as Stream from '@/Stream'

/**
 * Context is a special instance of Ref which will use the FiberContext tree to find where to
 * share state within.
 */
export interface Context<R, E, A> extends Ref.Ref<R, E, A> {}

export function fromFiberRef<R, E, A>(ref: FiberRef.FiberRef<R, E, A>): Context<R, E, A> {
  const values = FiberRef.values(ref)

  return {
    get: pipe(ref, FiberRef.get, withProvider(ref)),
    has: pipe(ref, FiberRef.has, withProvider(ref)),
    set: (a) => pipe(ref, FiberRef.set(a), withProvider(ref)),
    delete: pipe(ref, FiberRef.delete, withProvider(ref)),
    values: pipe(
      Stream.fromFx(findProvider(ref)),
      Stream.chain((c) => pipe(values, Stream.withinContext(c as any))),
    ) as unknown as Context<R, E, A>['values'],
  }
}

export const make = flow(FiberRef.make, fromFiberRef)
