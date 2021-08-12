import { flow, pipe } from './function'
import * as KV from './KV'
import * as Ref from './Ref'

/**
 * Context is an extensions of Ref which traverse up in context to find the closest environment
 * which contains the expected value.
 */
export interface Context<E, I, O = I> extends Ref.Ref<E, I, O> {}

/**
 * @since 0.11.0
 * @category Constructor
 */
export const fromKV = <K, E, A>(
  kv: KV.KV<K, E, A>,
): KV.KV<K, E, A> & Context<E & KV.KVEnv<K>, A> => ({
  ...kv,
  get: pipe(kv, KV.get, KV.withProvider(kv)),
  has: pipe(kv, KV.has, KV.withProvider(kv)),
  set: flow(KV.set(kv), KV.withProvider(kv)),
  update: flow(KV.update(kv), KV.withProvider(kv)),
  remove: pipe(kv, KV.remove, KV.withProvider(kv)),
  values: pipe(KV.listenToValues(kv), KV.withProviderStream(kv)),
})
