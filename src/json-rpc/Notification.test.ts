import { describe, given, it } from '@typed/test'
import { isRight } from 'fp-ts/es6/Either'
import { sample } from 'smallspace'

import { createCodecFromSchema, createGuardFromSchema, createInterpreter } from '../io'
import { createSmallspaceSchemable } from '../io/smallspace'
import { Notification } from './Notification'

export const test = describe(`Notification`, [
  given(`a SmallSpace Schemable`, [
    it(`generates some test values`, ({ ok }) => {
      const Test = Notification((t) => t.type({ method: t.string }))
      const smallInterpreter = createInterpreter(createSmallspaceSchemable())

      const TestSource = smallInterpreter(Test)
      const TestCodec = createCodecFromSchema(Test)
      const TestGuard = createGuardFromSchema(Test)

      for (const example of sample(TestSource)) {
        ok(isRight(TestCodec.decode(example)))
        ok(TestGuard.is(example))
      }
    }),
  ]),
])
