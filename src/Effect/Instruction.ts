import type { Fx } from '@/Fx'

import { Effect } from './Effect'

export const instr = <Type extends string>(type: Type) =>
  class Instruction<I, R, E, A> extends Effect<R, E, A> implements Fx<R, E, A> {
    static type: Type = type
    readonly type: Type = type

    constructor(readonly input: I, readonly trace?: string) {
      super()
    }

    *[Symbol.iterator]() {
      return (yield this) as A
    }
  }
