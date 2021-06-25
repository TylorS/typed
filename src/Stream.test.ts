import { pipe } from '@fp/function'
import * as R from '@fp/Resume'
import * as S from '@fp/Stream'
import { runEffects, tap } from '@fp/Stream'
import { newDefaultScheduler } from '@most/scheduler'
import { describe, given, it } from '@typed/test'

export const test = describe(`Stream`, [
  describe(`fromResume`, [
    given(`a Resume<A>`, [
      it(`returns a Stream<A> of that value`, async ({ equal }) => {
        const value = 1
        const stream = pipe(value, R.of, S.fromResume, tap(equal(value)))

        await runEffects(stream, newDefaultScheduler())
      }),
    ]),
  ]),
])
