import { Eq } from 'fp-ts/Eq'

import { Fx } from '@/Fx'
import { instr } from '@/internal'

import { FiberRef } from './FiberRef'

export type FiberRefInstruction<R, E, A, B> = MakeFiberRef<B> | ModifyFiberRef<R, E, A, B>

export interface MakeFiberRefOptions<A> extends Partial<Eq<A>> {}

export class MakeFiberRef<A> extends instr('MakeFiberRef')<unknown, never, FiberRef<A>> {
  constructor(readonly initial: A, readonly options: MakeFiberRefOptions<A> = {}) {
    super()
  }
}

export class ModifyFiberRef<R, E, A, B> extends instr('ModifyFiberRef')<
  R,
  E,
  readonly [computed: B, updated: A]
> {
  constructor(
    readonly fiberRef: FiberRef<A>,
    readonly modify: (a: A) => Fx<R, E, readonly [computed: B, updated: A]>,
  ) {
    super()
  }
}
