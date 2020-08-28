import { describe, given, it } from '@typed/test'
import { isRight } from 'fp-ts/es6/Either'
import * as T from 'io-ts/es6/Type'
import { sample } from 'smallspace'

import { interpret } from '../io'
import { createSchemable } from '../io/smallspace'
import { Notification } from './Notification'

export const test = describe(`Notification`, [
  given(`a SmallSpace Schemable`, [
    it(`generates some test values`, ({ ok }) => {
      const Test = Notification((t) => t.type({ method: t.string }))
      const TestSource = interpret(createSchemable(), Test)
      const TestCodec = interpret(T.Schemable, Test)

      for (const example of sample(TestSource)) {
        ok(isRight(TestCodec.decode(example)))
        ok(TestCodec.is(example))
      }
    }),
  ]),
])
