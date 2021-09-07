import { Eq } from 'fp-ts/Eq'
import { Magma } from 'fp-ts/Magma'

import { instr } from '@/internal'

import { FiberRef } from './FiberRef'

export type FiberRefInstruction<A, B> = MakeFiberRef<B> | ModifyFiberRef<A, B>

export interface MakeFiberRefOptions<A> extends Partial<Eq<A>>, Partial<Magma<A>> {}

export class MakeFiberRef<A> extends instr('MakeFiberRef')<unknown, never, FiberRef<A>> {
  constructor(readonly initial: A, readonly options: MakeFiberRefOptions<A> = {}) {
    super()
  }
}

export class ModifyFiberRef<A, B> extends instr('ModifyFiberRef')<
  unknown,
  never,
  readonly [computed: B, updated: A]
> {
  constructor(
    readonly fiberRef: FiberRef<A>,
    readonly modify: (a: A) => readonly [computed: B, updated: A],
  ) {
    super()
  }
}
