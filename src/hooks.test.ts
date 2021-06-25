import * as E from '@fp/Env'
import { pipe } from '@fp/function'
import * as S from '@fp/Stream'
import { runEffects } from '@fp/Stream'
import { newDefaultScheduler } from '@most/scheduler'
import { describe, given, it } from '@typed/test'

import { withHooks } from './hooks'
import * as Ref from './Ref'

export const test = describe(`hooks`, [
  describe(`withHooks`, [
    given(`a Env using Refs`, [
      it(`converts this to a stream`, async ({ equal }) => {
        const value = 0
        const ref = Ref.create(E.fromTask(async () => value))
        const scheduler = newDefaultScheduler()
        const main = withHooks(ref.get)
        const refs = Ref.refs()

        const expected = [value, value + 1, value + 2]
        const actual: number[] = []
        const stream = pipe(
          refs,
          main,
          S.tap((e) => actual.push(e)),
          S.take(expected.length),
          S.tap((n) => refs.refEvents[0]({ _tag: 'Updated', ref, previousValue: n, value: n + 1 })),
        )

        await runEffects(stream, scheduler)

        equal(expected, actual)
      }),
    ]),
  ]),
])
