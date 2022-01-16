import { isRight } from 'fp-ts/Either'

import { FromExit } from '@/Effect/FromExit'

import { ResumeNode, ResumeSync } from './Processor'

export const processFromExit = <E, A>(instruction: FromExit<E, A>) => {
  const exit = instruction.input

  if (isRight(exit)) {
    return new ResumeSync(exit.right)
  }

  return new ResumeNode({
    type: 'Exit',
    exit,
  })
}
