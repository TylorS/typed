import { FromIO } from '@/Effect/FromIO'

import { ResumeSync } from './Processor'

export const processFromIO = <A>(instruction: FromIO<A>) => new ResumeSync(instruction.input())
