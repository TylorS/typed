import { left, match } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'

import { FromExit } from '@/Effect'

import { ResumeExit, ResumeSync, RuntimeInstruction } from './RuntimeInstruction'

export const processFromExit = <E, A>(instruction: FromExit<E, A>) =>
  pipe(
    instruction.input,
    match(
      (cause): RuntimeInstruction<E> => new ResumeExit(left(cause)),
      (value) => new ResumeSync(value),
    ),
  )
