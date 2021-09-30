import { constant, flow } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'

import { BaseFx } from '@/Fx/BaseFx'
import { of } from '@/Fx/Computations'
import { Fx } from '@/Fx/Fx'
import { fromInstruction } from '@/Fx/Instruction'

import { FiberRef } from './FiberRef'

export type FiberRefInstruction<R, A> = GetFiberRef<A> | UpdateFiberRef<A, R> | DeleteFiberRef<A>

export class GetFiberRef<A> extends BaseFx<'GetFiberRef', unknown, A> {
  constructor(readonly fiberRef: FiberRef<A>) {
    super('GetFiberRef')
  }
}

export function get<A>(fiberRef: FiberRef<A>): Fx<unknown, A> {
  return fromInstruction(new GetFiberRef(fiberRef))
}

export class UpdateFiberRef<A, R> extends BaseFx<'UpdateFiberRef', R, A> {
  constructor(readonly fiberRef: FiberRef<A>, readonly f: (value: A) => Fx<R, A>) {
    super('UpdateFiberRef')
  }
}

export function update<A, R>(f: (value: A) => Fx<R, A>) {
  return (fiberRef: FiberRef<A>): Fx<R, A> => fromInstruction(new UpdateFiberRef(fiberRef, f))
}

export const set = flow(of, constant, update) as <A>(
  value: A,
) => <R>(fiberRef: FiberRef<A>) => Fx<R, A>

export class DeleteFiberRef<A> extends BaseFx<'DeleteFiberRef', unknown, Option<A>> {
  constructor(readonly fiberRef: FiberRef<A>) {
    super('DeleteFiberRef')
  }
}

const deleteFiberRef = <A>(fiberRef: FiberRef<A>): Fx<unknown, Option<A>> =>
  fromInstruction(new DeleteFiberRef(fiberRef))

export { deleteFiberRef as delete }
