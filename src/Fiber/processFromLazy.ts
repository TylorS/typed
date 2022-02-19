import { FromLazy } from '@/Effect'

import { ResumeSync } from './RuntimeInstruction'

export const processFromLazy = <A>(instruction: FromLazy<A>) => new ResumeSync(instruction.input())
