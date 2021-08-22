import { newDefaultScheduler } from '@most/scheduler'
import { deepStrictEqual } from 'assert'
import { pipe } from 'fp-ts/function'
import { describe } from 'mocha'

import { useKV } from './Context'
import * as E from './Env'
import * as KV from './KV'
import * as R from './Resume'
import * as S from './Stream'

describe(__filename, () => {
  describe(useKV.name, () => {
    describe('given a KV<K, E, A> with no istantiated value', () => {
      it('returns the default value', async () => {
        const initial = 1
        const kv = KV.make(E.of(initial))
        const grandparent = KV.env()
        const parent = KV.env({ parentEnv: grandparent })
        const child = KV.env({ parentEnv: parent })
        const withChild = pipe(useKV(kv), E.useSome(child))
        const scheduler = newDefaultScheduler()

        const promise = pipe({ scheduler }, withChild, R.toTask)()

        const n = await promise

        deepStrictEqual(n, initial)
      })

      it('replicates originating references to consumer', async () => {
        const initial = 1
        const kv = KV.make(E.of(initial))
        const grandparent = KV.env()
        const parent = KV.env({ parentEnv: grandparent })
        const child = KV.env({ parentEnv: parent })
        const withChild = pipe(useKV(kv), E.useSome(child))
        const event: KV.Event<symbol, number> = {
          _tag: 'Created',
          key: kv.key,
          value: initial,
          fromAncestor: false,
        }
        const scheduler = newDefaultScheduler()

        // Subscribe
        const promise = pipe(
          child.kvEvents[1],
          S.filter((x) => x.fromAncestor),
          S.take(1),
          S.collectEvents(scheduler),
        )

        pipe({ scheduler }, withChild, R.exec)

        const [actual] = await promise

        deepStrictEqual(actual, { ...event, fromAncestor: true })
      })
    })
  })
})
