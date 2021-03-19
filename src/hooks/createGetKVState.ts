import { KV, KV2, KV3, KV4 } from '@typed/fp/KV'
import { ask, MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import {
  createGetKV,
  createGetKVMap,
  createGetOrInsert,
  createSendSharedEvent,
  KVOf,
  Shared,
} from '@typed/fp/Shared'
import { WidenI } from '@typed/fp/Widen'
import { bind } from 'fp-ts/dist/Chain'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createKVStates } from './createKVStates'
import { UseState, UseState2, UseState3, UseState4 } from './UseState'

export function createGetKVState<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): <K, E, A>(shared: KV2<F, K, E, A>) => Kind2<F, WidenI<E | Shared<F>>, UseState2<F, A, A>>

export function createGetKVState<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <K, R, E, A>(
  shared: KV3<F, K, R, E, A>,
) => Kind3<F, WidenI<R | Shared<F>>, E, UseState3<F, A, A, E>>

export function createGetKVState<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <K, S, R, E, A>(
  shared: KV4<F, K, S, R, E, A>,
) => Kind4<F, S, WidenI<R | Shared<F>>, E, UseState4<F, A, A, S, E>>

export function createGetKVState<F>(
  M: MonadReader<F> & FromIO<F>,
): <K, E, A>(shared: KV<F, K, E, A>) => HKT2<F, E, UseState<F, A>>

export function createGetKVState<F>(M: MonadReader<F> & FromIO<F>) {
  const Do = M.of({})
  const bindTo = bind(M)
  const sharedStates = createKVStates(M)
  const getOrInsert = createGetOrInsert(M)
  const getKV = createGetKV(M)
  const getKVMap = createGetKVMap(M)
  const sendKVEvent = createSendSharedEvent(M)

  return <K, E, A>(kv: KV<F, K, E, A>) =>
    pipe(
      Do,
      bindTo('env', () => ask(M)<Shared<F>>()),
      bindTo('sharedStates', () => getKV(sharedStates)),
      M.chain(({ env, sharedStates }) =>
        getOrInsert(
          sharedStates,
          kv.key,
          pipe(
            Do,
            bindTo('sharedMap', () => getKVMap),
            bindTo('namespace', () => M.of(env.currentNamespace)),
            bindTo('initial', () => getKV(kv)),
            M.map(({ namespace, sharedMap, initial }) => {
              const key = kv.key

              const get = (): A =>
                sharedMap.has(key) ? sharedMap.get(key)! : sharedMap.set(key, initial).get(key)!

              const set = (value: A) => {
                const current = get()

                // Always set the updated value
                sharedMap.set(key, value)

                const hasNotChanged = kv.equals(current)(value)

                // Skip notifying downstream consumers if Eq says it hasn't changed
                if (hasNotChanged) {
                  return M.of(current)
                }

                return pipe(
                  sendKVEvent({
                    type: 'kv/updated',
                    namespace,
                    kv: kv as KVOf<F>,
                    previousValue: current,
                    value,
                  }),
                  M.map(() => value),
                )
              }

              const useState = [get, set] as const

              return useState
            }),
          ) as HKT2<F, any, UseState<F, A, A>>,
        ),
      ),
    )
}
