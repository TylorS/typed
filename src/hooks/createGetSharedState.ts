import { FromIO } from 'fp-ts/dist/FromIO'
import { bind } from 'fp-ts/dist/Chain'
import { MonadAsk } from '@typed/fp/MonadAsk'
import { UseSome } from '@typed/fp/Provide'
import {
  createGetOrInsert,
  createGetShared,
  createSendSharedEvent,
  RuntimeEnv,
  Shared,
  SharedOf,
} from '@typed/fp/Shared'
import { pipe } from 'fp-ts/dist/function'
import { createSharedStates } from './createGetSharedStates'
import { createGetSharedMap } from './createGetSharedMap'

export function createGetSharedState<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
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
      bindTo('sharedStates', ({ env }) => getShared(env)(sharedStates)),
      M.chain(({ env, sharedStates }) =>
        getOrInsert(
          sharedStates,
          shared.key,
          pipe(
            Do,
            bindTo('sharedMap', () => getSharedMap),
            bindTo('namespace', () => M.of(env.currentNamespace)),
            bindTo('initial', () => getShared(env)(shared)),
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
