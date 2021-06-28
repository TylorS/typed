import { pipe } from '@fp/function'
import * as R from '@fp/Resume'
import * as S from '@fp/Stream'
import { runEffects, tap } from '@fp/Stream'
import { mergeArray } from '@most/core'
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

  describe(S.sampleLatest.name, [
    given(`Stream<Stream<A>>`, [
      it(`subscribes to only one stream at a time`, async ({ equal }) => {
        let subscriptions = 0
        const increment = 10
        const numberOfItems = 10
        const delay = increment * numberOfItems

        const stream = mergeArray(
          Array.from({ length: numberOfItems }, (_, i) =>
            pipe(
              S.at(
                i * increment,
                pipe(
                  S.at(delay, i + 1),
                  S.tap(() => equal(1, ++subscriptions)),
                  S.concatMap(() => {
                    equal(0, --subscriptions)

                    return S.empty()
                  }),
                ),
              ),
            ),
          ),
        )

        await pipe(stream, S.sampleLatest, S.collectEvents(newDefaultScheduler()))
      }),

      it(`resamples when ongoing stream completes`, async ({ equal }) => {
        const increment = 10
        const numberOfItems = 10
        const delay = increment * numberOfItems
        const stream = mergeArray(
          Array.from({ length: numberOfItems }, (_, i) => S.at(i * increment, S.at(delay, i + 1))),
        )
        const actual = await pipe(stream, S.sampleLatest, S.collectEvents(newDefaultScheduler()))

        equal([1, numberOfItems], actual)
      }),
    ]),
  ]),
])
