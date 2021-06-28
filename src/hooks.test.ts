import * as E from '@fp/Env'
import { pipe } from '@fp/function'
import * as S from '@fp/Stream'
import { newDefaultScheduler } from '@most/scheduler'
import { describe, given, it } from '@typed/test'

import { withHooks } from './hooks'
import * as Ref from './Ref'

export const test = describe(`hooks`, [
  describe(`withHooks`, [
    given(`a Env using Refs`, [
      it(`converts this to a stream`, async ({ equal }) => {
        const value = 0
        const ref = Ref.create(E.of(value))
        const refs = Ref.refs()
        const [sendEvent] = refs.refEvents

        const expected = [value, value + 1, value + 2]
        const actual = await pipe(
          refs,
          withHooks(ref.get),
          S.switchLatest,
          S.take(expected.length),
          S.tap((n) => sendEvent({ _tag: 'Updated', ref, previousValue: n, value: n + 1 })),
          S.collectEvents(newDefaultScheduler()),
        )

        equal(expected, actual)
      }),
    ]),
  ]),
])
