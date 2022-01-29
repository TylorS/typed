import { flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'

import * as Fiber from '@/Fiber'
import * as FiberRef from '@/FiberRef'
import { Fx } from '@/Fx'
import * as Stream from '@/Stream'

export interface Ref<R, E, I, O = I> {
  readonly get: Fx<R, E, O>
  readonly has: Fx<R, E, boolean>
  readonly set: (input: I) => Fx<R, E, O>
  readonly delete: Fx<R, E, Option<O>>
  readonly values: Stream.Stream<R, E, Option<O>>
}

export function fromFiberRef<R, E, A>(fiberRef: FiberRef.FiberRef<R, E, A>): Ref<R, E, A> {
  return {
    get: FiberRef.get(fiberRef),
    has: FiberRef.has(fiberRef),
    set: (value: A) => pipe(fiberRef, FiberRef.set(value)),
    delete: FiberRef.delete(fiberRef),
    values: FiberRef.values(fiberRef) as unknown as Ref<R, E, A>['values'],
  }
}

export const make = flow(FiberRef.make, fromFiberRef)

export interface Global<R, E, I, O = I> extends Ref<R, E, I, O> {}

export function toGlobal<R, E, I, O>(ref: Ref<R, E, I, O>): Global<R, E, I, O> {
  return {
    get: Fiber.withinRootContext(ref.get),
    has: Fiber.withinRootContext(ref.has),
    set: flow(ref.set, Fiber.withinRootContext),
    delete: Fiber.withinRootContext(ref.delete),
    values: Stream.withinRootContext(ref.values),
  }
}

export const global = flow(make, toGlobal)

export function update<A, R2, E2>(f: (a: A) => Fx<R2, E2, A>) {
  return <R, E>(ref: Ref<R, E, A>): Fx<R & R2, E | E2, A> =>
    Fx(function* () {
      const a1 = yield* ref.get
      const a2 = yield* f(a1)

      return yield* ref.set(a2)
    })
}
