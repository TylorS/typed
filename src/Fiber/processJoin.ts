import { fromExit, Join } from '@/Effect'
import { isRight } from '@/Either'
import { Fx } from '@/Fx'

import { FxInstruction } from './Processor'

export const processJoin = <E, A>(instruction: Join<E, A>): FxInstruction<unknown, E, A> => ({
  type: 'Fx',
  fx: Fx(function* () {
    const exit = yield* instruction.input.exit

    if (isRight(exit)) {
      yield* instruction.input.inheritRefs
    }

    return yield* fromExit(exit, instruction.trace)
  }),
})
