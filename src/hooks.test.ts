import * as E from '@fp/Env'
import { useHooksArray, useRef, withHooks } from '@fp/hooks'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import { newDefaultScheduler } from '@most/scheduler'
import { deepStrictEqual, ok } from 'assert'
import { flow, increment, pipe } from 'fp-ts/function'
import { Eq } from 'fp-ts/number'

import * as S from './Stream'
import { useReaderStream } from './use'

describe(__filename, () => {
  describe(withHooks.name, () => {
    describe('Value updates', () => {
      it('renders the latest value', async () => {
        const scheduler = newDefaultScheduler()
        const numToString = withHooks<number>()(flow(String, E.of))
        const values = RS.mergeArray([RS.at(0, 1), RS.at(10, 2), RS.at(20, 3)])
        const expected = ['1', '2', '3']

        const actual = await pipe(
          Ref.refs(),
          numToString(values),
          S.take(expected.length),
          S.collectEvents(scheduler),
        )

        deepStrictEqual(actual, expected)
      })
    })

    describe('Ref updates', () => {
      it('renders the latest value', async () => {
        const refs = Ref.refs()
        const scheduler = newDefaultScheduler()

        const Component = withHooks<number>()((n: number) =>
          pipe(
            E.Do,
            E.bindW('ref', () => useRef(E.of(n), Eq)),
            E.chainFirstW(({ ref }) =>
              useReaderStream(
                pipe(
                  RS.periodic(10),
                  RS.exhaustMapLatestEnv(() => ref.set(n + 1)),
                ),
              ),
            ),
            E.chainW(({ ref }) => ref.get),
          ),
        )

        const values = RS.of(1)
        const expected = [1, 2]

        const actual = await pipe(
          { ...refs, scheduler },
          Component(values),
          S.take(expected.length),
          S.collectEvents(scheduler),
        )

        deepStrictEqual(actual, expected)
      })
    })

    describe('RefDisposable', async () => {
      it('disposes of resources', async () => {
        const refs = Ref.refs()
        const scheduler = newDefaultScheduler()

        let disposed = false

        const Component = withHooks<number>()((n) =>
          pipe(
            E.Do,
            E.bindW('ref', () => useRef(E.of(n), Eq)),
            E.chainFirstW(({ ref }) =>
              useReaderStream(
                pipe(
                  RS.at(10, null),
                  RS.exhaustMapLatestEnv(() => ref.set(n + 1)),
                  RS.onDispose({
                    dispose: () => {
                      disposed = true
                    },
                  }),
                ),
              ),
            ),
            E.chainW(({ ref }) => ref.get),
          ),
        )

        const values = RS.of(1)

        await pipe({ ...refs, scheduler }, Component(values), S.take(2), S.collectEvents(scheduler))

        ok(disposed)
      })
    })
  })

  describe(useHooksArray.name, () => {
    describe('Value updates', () => {
      it('renders the latest value', async () => {
        const scheduler = newDefaultScheduler()
        const numToString = useHooksArray<number>()(flow(String, E.of))
        const values = RS.mergeArray([RS.at(0, [1, 2, 3]), RS.at(10, [3, 2, 1]), RS.at(20, [1, 2])])
        const expected = [
          ['1', '2', '3'],
          ['3', '2', '1'],
          ['1', '2'],
        ]

        const actual = await pipe(
          Ref.refs(),
          numToString(values),
          S.take(expected.length),
          S.collectEvents(scheduler),
        )

        deepStrictEqual(actual, expected)
      })
    })

    describe('Ref updates', () => {
      it('renders the latest value', async () => {
        const refs = Ref.refs()
        const scheduler = newDefaultScheduler()

        const interval = 10

        const Component = (n: number) =>
          pipe(
            E.Do,
            E.bindW('ref', () => useRef(E.of(n), Eq)),
            E.chainFirstW(({ ref }) =>
              useReaderStream(
                pipe(
                  RS.periodic(interval * 1.5),
                  RS.skip(1), // Avoid additional emit at relative time 0
                  RS.chainEnvK(() => ref.update(flow(increment, E.of))),
                ),
              ),
            ),
            E.chainW(({ ref }) => ref.get),
          )

        const values = RS.mergeArray([
          RS.at(0, [1, 2, 3]),
          RS.at(interval, [3, 2, 1]),
          RS.at(interval * 2, [1, 2]),
          RS.at(interval * 4, []),
        ])
        const expected = [
          [1, 2, 3],
          [3, 2, 1],
          [3, 2, 2],
          [3, 3, 2],
          [4, 3, 2],
          [2, 3],
          [3, 3],
          [3, 4],
          [],
        ]

        const actual = await pipe(
          { ...refs, scheduler },
          useHooksArray<number>()(Component)(values),
          S.take(expected.length),
          S.collectEvents(scheduler),
        )

        deepStrictEqual(actual, expected)
      })
    })
  })
})
