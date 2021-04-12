import { constVoid, flow, pipe } from '@fp/function'
import * as R from '@fp/Resume'
import { describe, given, it } from '@typed/test'
import { askQuestion } from 'askQuestion'
import { EOL } from 'os'

export const test = describe(`askQuestion`, [
  given(`a question`, [
    it(`prints that question and waits for a reply`, ({ equal }) => {
      const question = 'Whats up?'
      const answer = 'The sky!'

      pipe(
        {
          getStr: R.of(answer),
          putStr: flow(equal(EOL + question), () => R.sync(constVoid)),
        },
        askQuestion(question),
        R.start(equal(answer)),
      )
    }),
  ]),
])
