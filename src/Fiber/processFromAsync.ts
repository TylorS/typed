import { FromAsync } from '@/Effect/FromAsync'

import { ResumeAsync } from './Processor'

export const processFromAsync = <A>(instruction: FromAsync<A>) =>
  new ResumeAsync(instruction.input.run)
