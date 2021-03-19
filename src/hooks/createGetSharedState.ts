import { ask, MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import {
  createGetOrInsert,
  createGetShared,
  createSendSharedEvent,
  RuntimeEnv,
  Shared,
  Shared2,
  Shared3,
  Shared4,
  SharedOf,
} from '@typed/fp/Shared'
import { bind } from 'fp-ts/dist/Chain'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createGetSharedMap } from '../Shared/runtime/createGetSharedMap'
import { WidenI } from '../Widen'
import { createSharedStates } from './createGetSharedStates'
import { UseState, UseState2, UseState3, UseState4 } from './UseState'

export function createGetSharedState<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | RuntimeEnv<F>>, UseState2<F, A, A>>

export function createGetSharedState<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <K, R, E, A>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, WidenI<R | RuntimeEnv<F>>, E, UseState3<F, A, A, E>>

export function createGetSharedState<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <K, S, R, E, A>(
  shared: Shared4<F, K, S, R, E, A>,
) => Kind4<F, S, WidenI<R | RuntimeEnv<F>>, E, UseState4<F, A, A, S, E>>

export function createGetSharedState<F>(
  M: MonadReader<F> & FromIO<F>,
): <K, E, A>(shared: Shared<F, K, E, A>) => HKT2<F, E, UseState<F, A>>

export function createGetSharedState<F>(M: MonadReader<F> & FromIO<F>) {
  const Do = M.of({})
  const bindTo = bind(M)
  const sharedStates = createSharedStates(M)
  const getOrInsert = createGetOrInsert(M)
  const getShared = createGetShared(M)
  const getSharedMap = createGetSharedMap(M)
  const sendSharedEvent = createSendSharedEvent(M)

  return <K, E, A>(shared: Shared<F, K, E, A>) =>
    pipe(
      Do,
      bindTo('env', () => ask(M)<RuntimeEnv<F>>()),
      bindTo('sharedStates', () => getShared(sharedStates)),
      M.chain(({ env, sharedStates }) =>
        getOrInsert(
          sharedStates,
          shared.key,
          pipe(
            Do,
            bindTo('sharedMap', () => getSharedMap),
            bindTo('namespace', () => M.of(env.currentNamespace)),
            bindTo('initial', () => getShared(shared)),
            M.map(({ namespace, sharedMap, initial }) => {
              const key = shared.key

              const get = (): A =>
                sharedMap.has(key) ? sharedMap.get(key)! : sharedMap.set(key, initial).get(key)!

              const set = (value: A) => {
                const current = get()

                // Always set the updated value
                sharedMap.set(key, value)

                const hasNotChanged = shared.equals(current)(value)

                // Skip notifying downstream consumers if Eq says it hasn't changed
                if (hasNotChanged) {
                  return M.of(current)
                }

                return pipe(
                  sendSharedEvent({
                    type: 'sharedValue/updated',
                    namespace,
                    shared: shared as SharedOf<F>,
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
