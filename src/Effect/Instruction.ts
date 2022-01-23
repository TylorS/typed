import type { Fx } from '@/Fx'

import type { Effect } from './Effect'

export const instr = <Type extends string>(type: Type) =>
  class Instruction<I, R, E, A> implements Effect<R, E, A>, Fx<R, E, A> {
    readonly _R!: (r: R) => void
    readonly _E!: () => E
    readonly _A!: () => A

    static type: Type = type
    readonly type: Type = type

    constructor(readonly input: I, readonly trace?: string) {}

    *[Symbol.iterator]() {
      return (yield this) as A
    }
  }
