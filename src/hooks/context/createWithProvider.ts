import { getDo, toMonad } from '@typed/fp/FxT'
import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { getCurrentNamespace, Namespace, usingNamespace } from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import { createGetOrInsert, RuntimeEnv, Shared, Shared2, Shared3, Shared4 } from '@typed/fp/Shared'
import { WidenI } from '@typed/fp/Widen'
import { bind, chainFirst } from 'fp-ts/dist/Chain'
import { ChainRec, ChainRec2, ChainRec3, ChainRec4 } from 'fp-ts/dist/ChainRec'
import { Eq } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { isNone } from 'fp-ts/dist/Option'

import { createGetNamespaceConsumers } from './NamespaceConsumers'
import { createGetNamespaceParent } from './NamespaceParent'
import { createGetNamespaceProviders } from './NamespaceProviders'

export function createWithProvider<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F> & ChainRec2<F>,
): <K, A, B, C>(
  shared: Shared2<F, K, A, B>,
  f: (provider: Namespace) => Kind2<F, A, C>,
) => Kind2<F, WidenI<RuntimeEnv<F> | A>, C>

export function createWithProvider<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F> & ChainRec3<F>,
): <K, A, B, C, D>(
  shared: Shared3<F, K, A, B, C>,
  f: (provider: Namespace) => Kind3<F, A, B, D>,
) => Kind3<F, WidenI<RuntimeEnv<F> | A>, B, D>

export function createWithProvider<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F> & ChainRec4<F>,
): <K, A, B, C, D, E>(
  shared: Shared4<F, K, A, B, C, D>,
  f: (provider: Namespace) => Kind4<F, A, B, C, E>,
) => Kind4<F, A, WidenI<RuntimeEnv<F> | B>, C, E>

export function createWithProvider<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F> & ChainRec<F>,
): <K, A, B>(shared: Shared<F, K, A>, f: (provider: Namespace) => HKT<F, B>) => HKT<F, B>

export function createWithProvider<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F> & ChainRec<F>) {
  const getNamespace = getCurrentNamespace(M)
  const getNamespaceParent = createGetNamespaceParent(M)
  const getProviders = createGetNamespaceProviders(M)
  const getConsumers = createGetNamespaceConsumers(M)
  const getOrInsert = createGetOrInsert(M)
  const doFx = getDo<F>()
  const toM = toMonad(M)
  const using = usingNamespace(M)
  const Do = M.of({})
  const bindTo = bind(M)
  const chainFirst_ = chainFirst(M)

  return <K, A, B>(shared: Shared<F, K, A>, f: (provider: Namespace) => HKT<F, B>) =>
    pipe(
      Do,
      bindTo('namespace', getNamespace),
      bindTo('env', () => M.ask<RuntimeEnv<F>>()),
      bindTo('provider', ({ env, namespace }) =>
        toM(
          doFx(function* (_) {
            const states = env.sharedKeyStore
            let current = namespace

            while (current) {
              const hasState = states.get(current)?.has(shared.key)

              if (hasState) {
                return current
              }

              const parent = yield* pipe(getNamespaceParent, using(current), _)

              if (isNone(parent)) {
                return current
              }

              current = parent.value
            }

            return namespace
          }),
        ),
      ),
      bindTo('providers', () => getProviders),
      bindTo('consumersMap', ({ provider }) => pipe(getConsumers, using(provider))),
      bindTo('consumers', ({ consumersMap }) =>
        getOrInsert(
          consumersMap,
          shared.key,
          M.fromIO(() => new Map<Namespace, Set<Eq<any>>>()),
        ),
      ),
      chainFirst_(({ consumers, namespace, providers, provider }) => {
        addToSet(consumers, namespace, shared)
        providers.add(provider)

        return M.of(void 0)
      }),
      M.chain(({ provider }) => f(provider)),
    )
}

function addToSet<A, B>(map: Map<A, Set<B>>, key: A, value: B): boolean {
  if (!map.get(key)) {
    map.set(key, new Set())

    return false
  }

  const set = map.get(key)!

  set.add(value)

  return true
}
