import { pipe } from '@fp/function'
import * as R from '@fp/Resume'
import * as S from '@fp/Stream'
import { runEffects, tap } from '@fp/Stream'
import { mergeArray } from '@most/core'
import { newDefaultScheduler } from '@most/scheduler'
import { deepStrictEqual } from 'assert'

export const test = describe(`Stream`, () => {
  describe(S.fromResume.name, () => {
    describe(`given a Resume<A>`, () => {
      it(`returns a Stream<A> of that value`, async () => {
        const value = 1
        const stream = pipe(
          value,
          R.of,
          S.fromResume,
          tap((x) => deepStrictEqual(x, value)),
        )

        await runEffects(stream, newDefaultScheduler())
      })
    })
  })

  describe(S.exhaust.name, () => {
    describe(`given, Stream<Stream<A>>`, () => {
      it(`subscribes to only one stream at a time`, async () => {
        let subscriptions = 0
        const increment = 1
        const numberOfItems = 10
        const delay = increment * numberOfItems

        const stream = mergeArray(
          Array.from({ length: numberOfItems }, (_, i) =>
            pipe(
              S.at(
                i * increment,
                pipe(
                  S.at(delay, i + 1),
                  S.tap(() => deepStrictEqual(++subscriptions, 1)),
                  S.concatMap(() => {
                    deepStrictEqual(--subscriptions, 0)

                    return S.empty()
                  }),
                ),
              ),
            ),
          ),
        )

        await pipe(stream, S.exhaust, S.collectEvents(newDefaultScheduler()))
      })

      it(`resamples when ongoing stream completes`, async () => {
        const increment = 1
        const numberOfItems = 10
        const delay = increment * numberOfItems
        const stream = mergeArray(
          Array.from({ length: numberOfItems }, (_, i) => S.at(i * increment, S.at(delay, i + 1))),
        )
        const actual = await pipe(stream, S.exhaust, S.collectEvents(newDefaultScheduler()))

        deepStrictEqual(actual, [1, numberOfItems])
      })
    })
  })

  describe(S.exhaustAllWhen.name, () => {
    it(`subscribes to added values and unsubscribes to removed values`, async () => {
      const byNumber = S.exhaustAllWhen<number>()((x) => mergeArray([S.now(x), S.at(5, x + 1)]))

      const values = await pipe(
        mergeArray([S.now([1, 2, 3]), S.at(10, [3, 2, 1]), S.at(20, [1, 3])]),
        byNumber,
        S.collectEvents(newDefaultScheduler()),
      )

      deepStrictEqual(values, [
        [1, 2, 3],
        [2, 3, 4],
        [4, 3, 2],
        [2, 4],
      ])
    })
  })
})
