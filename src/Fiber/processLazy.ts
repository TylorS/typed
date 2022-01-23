import { Lazy } from '@/Effect'

import { FxInstruction } from './Processor'

export const processLazy = <R, E, A>(instruction: Lazy<R, E, A>): FxInstruction<R, E, A> => ({
  type: 'Fx',
  fx: instruction.input(),
})
