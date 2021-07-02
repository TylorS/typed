import * as E from '@fp/Env'
import { pipe } from '@fp/function'
import { mergeMapWithHooks, useRef, withHooks } from '@fp/hooks'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import * as RefDisposable from '@fp/RefDisposable'
import { exec } from '@fp/Resume'
import * as S from '@fp/Stream'
import * as Sc from '@most/scheduler'
import { deepStrictEqual } from 'assert'
import { Eq } from 'fp-ts/number'

export const test = describe(`hooks`, () => {
  describe(withHooks.name, () => {
    describe(`given a Env using Refs`, () => {
      it(`converts this to a Stream`, async () => {
        const value = 0
        const ref = Ref.create(E.of(value))
        const refs = Ref.refs()
        const [sendEvent] = refs.refEvents

        const expected = [value, value + 1, value + 2]
        const actual = await pipe(
          refs,
          withHooks(ref.get),
          S.take(expected.length),
          S.tap((n) => sendEvent({ _tag: 'Updated', ref, previousValue: n, value: n + 1 })),
          S.collectEvents(Sc.newDefaultScheduler()),
        )

        deepStrictEqual(actual, expected)
      })

      it(`converts self-updating component to a Stream`, async () => {
        const value = 0
        const scheduler = Sc.newDefaultScheduler()
        const refs = Ref.refs()

        const Component = pipe(
          E.Do,
          E.bindW('ref', () => useRef(E.of(value), Eq)),
          E.bindW('increment', ({ ref }) => E.askAndUse(ref.set(value + 1))),
          E.chainFirstW(({ increment }) =>
            RefDisposable.add(
              Sc.asap(
                S.createCallbackTask(() => pipe({}, increment, exec)),
                scheduler,
              ),
            ),
          ),
          E.chainW(({ ref }) => ref.get),
        )

        const values = await pipe(refs, withHooks(Component), S.take(2), S.collectEvents(scheduler))

        deepStrictEqual(values, [value, value + 1])
      })
    })
  })

  describe(mergeMapWithHooks.name, () => {
    it(`converts this to a Stream`, async () => {
      const scheduler = Sc.newDefaultScheduler()
      const Component = (x: number) =>
        pipe(
          E.Do,
          E.bindW('ref', () => useRef(E.of(x), Eq)),
          E.bindW('increment', ({ ref }) => E.askAndUse(ref.set(x + 1))),
          E.chainFirstW(({ increment }) =>
            x === 3
              ? RefDisposable.add(
                  Sc.asap(
                    S.createCallbackTask(() => pipe({}, increment, exec)),
                    scheduler,
                  ),
                )
              : E.of(null),
          ),
          E.chainW(({ ref }) => ref.get),
        )

      const mergeN = mergeMapWithHooks(Eq)

      const program = pipe(
        RS.mergeArray([RS.now([1, 2, 3]), RS.at(10, [2, 3, 1]), RS.at(20, [3, 2])] as const),
        mergeN(Component),
        RS.take(4),
        RS.collectEvents(scheduler),
      )

      const values = await program(Ref.refs())

      deepStrictEqual(values, [
        [1, 2, 3],
        [1, 2, 4],
        [2, 4, 1],
        [4, 2],
      ])
    })
  })
})
