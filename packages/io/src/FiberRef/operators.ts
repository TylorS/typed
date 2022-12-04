import { pipe } from '@fp-ts/data/Function'
import { Option } from '@fp-ts/data/Option'

import { Effect } from '../Effect.js'
import * as ops from '../Effect/operators.js'

import { FiberRef } from './FiberRef.js'

export const get = ops.getFiberRef

export const set = ops.setFiberRef

export const update = ops.updateFiberRef

export const modify = ops.modifyFiberRef

export const remove: <R, E, A>(ref: FiberRef<R, E, A>) => Effect<R, E, Option<A>> =
  ops.deleteFiberRef

export { remove as delete }

export const updateEffect = ops.updateFiberRefEffect

export const modifyEffect = ops.modifyFiberRefEffect

export function getAndSet<A>(a: A) {
  return ops.modifyFiberRef((_: A) => [_, a])
}

export function getAndUpdate<A>(f: (a: A) => A) {
  return ops.modifyFiberRef((a: A) => [a, f(a)])
}

export function getAndUpdateEffect<R, E, A>(f: (a: A) => Effect<R, E, A>) {
  return ops.modifyFiberRefEffect((a: A) =>
    pipe(
      a,
      f,
      ops.map((a1) => [a, a1]),
    ),
  )
}
