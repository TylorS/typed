import { FromAsync } from '@/Effect'

import { ResumeAsync } from './RuntimeInstruction'

export const processFromAsync = <A>(instruction: FromAsync<A>) => new ResumeAsync(instruction.input)
