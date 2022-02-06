import * as Fiber from '@/Fiber'
import * as FiberRef from '@/FiberRef'
import { flow, pipe } from '@/function'
import { Fx, of } from '@/Fx'
import { Option } from '@/Option'
import * as Stream from '@/Stream'

export interface Ref<R, I, E, O = I> {
  readonly get: Fx<R, E, O>
  readonly has: Fx<R, E, boolean>
  readonly update: <R2, E2>(f: (output: O) => Fx<R2, E2, I>) => Fx<R & R2, E | E2, O>
  readonly delete: Fx<R, E, Option<O>>
  readonly values: Stream.Stream<R, E, Option<O>>
}

export function fromFiberRef<R, E, A>(fiberRef: FiberRef.FiberRef<R, E, A>): Ref<R, A, E> {
  return {
    get: FiberRef.get(fiberRef),
    has: FiberRef.has(fiberRef),
    update: (f) => pipe(fiberRef, FiberRef.update(f)),
    delete: FiberRef.delete(fiberRef),
    values: FiberRef.values(fiberRef) as unknown as Ref<R, A, E>['values'],
  }
}

export const make = flow(FiberRef.make, fromFiberRef)

export interface Global<R, E, I, O = I> extends Ref<R, E, I, O> {}

export function toGlobal<R, E, I, O>(ref: Ref<R, E, I, O>): Global<R, E, I, O> {
  return {
    get: Fiber.withinRootContext(ref.get),
    has: Fiber.withinRootContext(ref.has),
    update: flow(ref.update, Fiber.withinRootContext),
    delete: Fiber.withinRootContext(ref.delete),
    values: Stream.withinRootContext(ref.values),
  }
}

export const global = flow(make, toGlobal)

export const set =
  <I>(input: I) =>
  <R, E, O>(ref: Ref<R, I, E, O>) =>
    ref.update(() => of(input))

export const compute =
  <O, I>(f: (output: O) => I) =>
  <R, E>(ref: Ref<R, I, E, O>): Fx<R, E, O> =>
    ref.update(flow(f, of))
