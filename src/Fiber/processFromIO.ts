import { FromLazy } from '@/Effect'

import { ResumeSync } from './RuntimeInstruction'

export const processFromIO = <A>(instruction: FromLazy<A>) => new ResumeSync(instruction.input())
