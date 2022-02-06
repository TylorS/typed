import { FromExit } from '@/Effect'
import { Left, match } from '@/Either'
import { pipe } from '@/function'

import { ResumeExit, ResumeSync, RuntimeInstruction } from './RuntimeInstruction'

export const processFromExit = <E, A>(instruction: FromExit<E, A>) =>
  pipe(
    instruction.input,
    match(
      (cause): RuntimeInstruction<E> => new ResumeExit(Left(cause)),
      (value) => new ResumeSync(value),
    ),
  )
