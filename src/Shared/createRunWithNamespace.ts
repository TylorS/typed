import { ask, MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import { Namespace } from '@typed/fp/Namespace'
import { bind, chainFirst } from 'fp-ts/dist/Chain'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createGetKVMap } from './createGetSharedMap'
import { Shared } from './Shared'
import { EffectOf } from './SharedEvent'

export function createRunWithNamespace<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <E extends Shared<F>, A>(effect: Kind2<F, E, A>) => Kind2<F, E, A>

export function createRunWithNamespace<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <R extends Shared<F>, E, A>(effect: Kind3<F, R, E, A>) => Kind3<F, R, E, A>

export function createRunWithNamespace<F extends URIS3, E>(
  M: MonadReader3<F> & FromIO3<F>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <R extends Shared<F>, A>(effect: Kind3<F, R, E, A>) => Kind3<F, R, E, A>

export function createRunWithNamespace<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <S, R extends Shared<F>, E, A>(effect: Kind4<F, S, R, E, A>) => Kind4<F, S, R, E, A>

export function createRunWithNamespace<F>(
  M: MonadReader<F> & FromIO<F>,
): <K extends PropertyKey>(
  namespace: Namespace<K>,
) => <E extends Shared<F>, A>(effect: HKT2<F, E, A>) => HKT2<F, E, A>

export function createRunWithNamespace<F>(M: MonadReader<F> & FromIO<F>) {
  const getMap = createGetKVMap(M)
  const Do = M.of({})
  const bindTo = bind(M)
  const chainF = chainFirst(M)

  return (namespace: Namespace) => <E extends Shared<F>, A>(effect: HKT2<F, E, A>) =>
    pipe(
      Do,
      bindTo('env', () => ask(M)<Shared<F>>()),
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
