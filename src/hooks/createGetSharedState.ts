import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { bind } from 'fp-ts/dist/Chain'
import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
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
import { pipe } from 'fp-ts/dist/function'
import { createSharedStates } from './createGetSharedStates'
import { createGetSharedMap } from './createGetSharedMap'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { UseState, UseState2, UseState3, UseState4 } from './UseState'
import { WidenI } from '../Widen'

export function createGetSharedState<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F>,
): <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | RuntimeEnv<F>>, UseState2<F, A, A>>

export function createGetSharedState<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F>,
): <K, R, E, A>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, WidenI<R | RuntimeEnv<F>>, E, UseState3<F, A, A, E>>

export function createGetSharedState<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F>,
): <K, S, R, E, A>(
  shared: Shared4<F, K, S, R, E, A>,
) => Kind4<F, S, WidenI<R | RuntimeEnv<F>>, E, UseState4<F, A, A, S, E>>

export function createGetSharedState<F>(
  M: MonadAsk<F> & FromIO<F>,
): <K, A>(shared: Shared<F, K, A>) => HKT<F, UseState<F, A>>

export function createGetSharedState<F>(M: MonadAsk<F> & FromIO<F>) {
  const Do = M.of({})
  const bindTo = bind(M)
  const sharedStates = createSharedStates(M)
  const getOrInsert = createGetOrInsert(M)
  const getShared = createGetShared(M)
  const getSharedMap = createGetSharedMap(M)
  const sendSharedEvent = createSendSharedEvent(M)

  return <K, A>(shared: Shared<F, K, A>) =>
    pipe(
      Do,
      bindTo('env', () => M.ask<RuntimeEnv<F>>()),
      bindTo('sharedStates', ({}) => getShared(sharedStates)),
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

                sharedMap.set(key, value)

                const changed = !shared.equals(current)(value)

                if (changed) {
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

                return M.of(value)
              }

              const useState = [get, set] as const

              return useState
            }),
          ),
        ),
      ),
    )
}
