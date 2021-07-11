import * as E from '@fp/Env'
import { useRef, withHooks } from '@fp/hooks'
import * as RS from '@fp/ReaderStream'
import * as Ref from '@fp/Ref'
import { newDefaultScheduler } from '@most/scheduler'
import { deepStrictEqual, ok } from 'assert'
import { flow, pipe } from 'fp-ts/function'
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
                  RS.at(10, null),
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
})
