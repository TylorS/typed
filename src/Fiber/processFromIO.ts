import { FromIO } from '@/Effect'

import { ResumeSync } from './RuntimeInstruction'

export const processFromIO = <A>(instruction: FromIO<A>) => new ResumeSync(instruction.input())
