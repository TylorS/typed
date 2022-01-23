import { FromPromise } from '@/Effect'

import { ResumePromise } from './RuntimeInstruction'

export const processFromPromise = <A>(instruction: FromPromise<A>) =>
  new ResumePromise(instruction.input)
