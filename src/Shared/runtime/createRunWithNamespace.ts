import { MonadAsk, MonadAsk2, MonadAsk2C, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { Namespace } from '@typed/fp/Namespace'
import { bind, chainFirst } from 'fp-ts/dist/Chain'
import { FromIO, FromIO2, FromIO2C, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createGetSharedMap } from './createGetSharedMap'
import { RuntimeEnv } from './RuntimeEnv'
import { EffectOf } from './SharedEvent'

export function createRunWithNamespace<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <E extends RuntimeEnv<F>, A>(effect: Kind2<F, E, A>) => Kind2<F, E, A>

export function createRunWithNamespace<F extends URIS2, E>(
  M: MonadAsk2C<F, E> & FromIO2C<F, E>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <E extends RuntimeEnv<F>, A>(effect: Kind2<F, E, A>) => Kind2<F, E, A>

export function createRunWithNamespace<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <R extends RuntimeEnv<F>, E, A>(effect: Kind3<F, R, E, A>) => Kind3<F, R, E, A>

export function createRunWithNamespace<F extends URIS3, E>(
  M: MonadAsk3<F> & FromIO3<F>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <R extends RuntimeEnv<F>, A>(effect: Kind3<F, R, E, A>) => Kind3<F, R, E, A>

export function createRunWithNamespace<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <S, R extends RuntimeEnv<F>, E, A>(effect: Kind4<F, S, R, E, A>) => Kind4<F, S, R, E, A>

export function createRunWithNamespace<F>(
  M: MonadAsk<F> & FromIO<F>,
): (namespace: Namespace) => <A>(effect: HKT<F, A>) => HKT<F, A>

export function createRunWithNamespace<F>(M: MonadAsk<F> & FromIO<F>) {
  const getMap = createGetSharedMap(M)
  const Do = M.of({})
  const bindTo = bind(M)
  const chainF = chainFirst(M)

  return (namespace: Namespace) => <A>(effect: HKT<F, A>) =>
    pipe(
      Do,
      bindTo('env', () => M.ask<RuntimeEnv<F>>()),
      bindTo('map', () => getMap),
      bindTo('parent', ({ env }) => M.of(env.currentNamespace)),
      chainF(({ env, parent }) => {
        const [send] = env.sharedEvents

        send({ type: 'namespace/started', parent, namespace, effect: effect as EffectOf<F> })

        return M.of(null)
      }),
      bindTo('returnValue', () => effect),
      M.map(({ returnValue, parent, env }) => {
        const [send] = env.sharedEvents

        send({
          type: 'namespace/completed',
          parent,
          namespace,
          effect: effect as EffectOf<F>,
          returnValue,
        })

        return returnValue
      }),
    )
}
