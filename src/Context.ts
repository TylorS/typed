/**
 * Context is an alternative implementation of Ref which is capable of traversing up
 * in a graph of to find if any ancestors contain the given value. This is allows sharing values
 * across otherwise isolated environments.
 * @since 0.11.0
 */
import * as E from './Env'
import * as EO from './EnvOption'
import { flow, identity, pipe } from './function'
import * as KV from './KV'
import * as RS from './ReaderStream'
import * as Ref from './Ref'
import { SchedulerEnv } from './Scheduler'
import { useReaderStream } from './use'

/**
 * Context is an extensions of Ref which traverse up in context to find the closest environment
 * which contains the expected value.
 * @since 0.11.0
 * @categeory Model
 */
export interface Context<E, I, O = I> extends Ref.Ref<E, I, O> {}

/**
 * @since 0.11.0
 * @category Constructor
 */
export const fromKV = <K, E, A>(
  kv: KV.KV<K, E, A>,
): Context<E & KV.Env & SchedulerEnv, A, A> & KV.KV<K, E, A> => ({
  ...kv,
  get: useKV(kv),
  has: pipe(kv, KV.has, KV.withProvider(kv)),
  set: flow(KV.set(kv), KV.withProvider(kv)),
  update: flow(KV.update(kv), KV.withProvider(kv)),
  remove: pipe(kv, KV.remove, KV.withProvider(kv)),
  values: pipe(KV.listenToValues(kv), KV.withProviderStream(kv)),
})

/**
 * Allows subscribing to the updates ensuring the current KV receives all
 * updates from an Ancestor.
 * @since 0.9.2
 * @category Combinator
 */
export function useKV<K, E, A>(kv: KV.KV<K, E, A>): E.Env<E & KV.Env & SchedulerEnv, A> {
  const useValues = useReaderStream()
  const useReplicateEvents = useReaderStream()

  return pipe(
    E.Do,
    E.bindW('currentRefs', () => KV.getEnv),
    E.bindW('providerRefs', () => KV.findKVProvider(kv)),
    E.bindW('value', ({ providerRefs }) =>
      pipe(
        kv,
        KV.listenToValues,
        RS.useSome(providerRefs),
        useValues,
        EO.chainOptionK(identity),
        EO.getOrElseEW(() => pipe(kv, KV.get, E.useSome(providerRefs))),
      ),
    ),
    E.chainFirstW(({ currentRefs, providerRefs }) =>
      pipe(
        kv,
        KV.listenTo,
        RS.useSome(providerRefs),
        RS.chainEnvK((event) =>
          pipe({ ...event, fromAncestor: true }, KV.sendEvent, E.useSome(currentRefs)),
        ),
        useReplicateEvents,
      ),
    ),
    E.map(({ value }) => value),
  )
}

/**
 * @since 0.13.7
 * @category Constructor
 */
export const kv = flow(KV.make, fromKV)
