import { contramap, filter } from '@typed/fp/Adapter'
import { DeleteKV, GetKV, SetKV } from '@typed/fp/KV'
import { createUseKV, KvEnv, KvEvent } from '@typed/fp/KvEnv'
import {
  ask,
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { CurrentNamespace, Namespace } from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome3C, UseSome4 } from '@typed/fp/Provide'
import { WidenI } from '@typed/fp/Widen'
import { bind, chainFirst } from 'fp-ts/dist/Chain'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createGetOrCreateNamespace } from './createGetOrCreateNamespace'
import { createSendSharedEvent } from './createSendSharedEvent'
import { EffectOf, Shared, SharedEvent, SharedValueEvent } from './Shared'

const kvTypes = new Set<SharedEvent<any>['type']>(['kv/created', 'kv/updated', 'kv/deleted'])
const isKvEvent = <F>(event: SharedEvent<F>): event is SharedValueEvent<F> =>
  kvTypes.has(event.type)

export function runWithNamespace<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F> & UseSome4<F>,
): <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => <S, R, E, A>(
  hkt: Kind4<F, S, WidenI<R | KvEnv<F, any, any> | GetKV<F> | SetKV<F> | DeleteKV<F>>, E, A>,
) => Kind4<F, S, WidenI<R | Shared<F>>, E, A>

export function runWithNamespace<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F> & UseSome3<F>,
): <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => <R, E, A>(
  hkt: Kind3<F, WidenI<R | KvEnv<F, any, any> | GetKV<F> | SetKV<F> | DeleteKV<F>>, E, A>,
) => Kind3<F, WidenI<R | Shared<F>>, E, A>

export function runWithNamespace<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E> & UseSome3C<F, E>,
): <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => <R, A>(
  hkt: Kind3<F, WidenI<R | KvEnv<F, any, any> | GetKV<F> | SetKV<F> | DeleteKV<F>>, E, A>,
) => Kind3<F, WidenI<R | Shared<F>>, E, A>

export function runWithNamespace<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F> & UseSome2<F>,
): <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => <E, A>(
  hkt: Kind2<F, WidenI<E | KvEnv<F, any, any> | GetKV<F> | SetKV<F> | DeleteKV<F>>, A>,
) => Kind2<F, WidenI<E | Shared<F>>, A>

export function runWithNamespace<F>(
  M: MonadReader<F> & FromIO<F> & UseSome<F>,
): <K extends PropertyKey = PropertyKey>(
  namespace: Namespace<K>,
) => <E, A>(
  hkt: HKT2<F, WidenI<E | KvEnv<F, any, any> | GetKV<F> | SetKV<F> | DeleteKV<F>>, A>,
) => HKT2<F, WidenI<E | Shared<F>>, A>

export function runWithNamespace<F>(M: MonadReader<F> & FromIO<F> & UseSome<F>) {
  const get = ask(M)
  const getOrCreateNamespace = createGetOrCreateNamespace(M)
  const sendEvent = createSendSharedEvent(M)
  const bindTo = bind(M)
  const Do = M.of({})
  const useKv = createUseKV(M)
  const chainF = chainFirst(M)

  return <K extends PropertyKey = PropertyKey>(namespace: Namespace<K>) => {
    return <E, A>(
      hkt: HKT2<F, WidenI<E | KvEnv<F, any, any> | GetKV<F> | SetKV<F> | DeleteKV<F>>, A>,
    ) => {
      return pipe(
        Do,
        bindTo('env', () => get<Shared<F> & CurrentNamespace>()),
        bindTo('kvEvents', ({ env: { sharedEvents } }) =>
          pipe(
            sharedEvents,
            filter((x) => x.namespace === namespace),
            filter(isKvEvent),
            contramap((event: KvEvent<F>): SharedValueEvent<F> => ({ ...event, namespace })),
            M.of,
          ),
        ),
        bindTo('kvMap', () => getOrCreateNamespace(namespace)),
        M.chain(({ kvMap, kvEvents, env: { currentNamespace } }) => {
          const effect = pipe(
            hkt,
            useKv,
            M.useSome<KvEnv<F, any, any>>({ kvEvents, kvMap }),
          )

          return pipe(
            sendEvent({
              type: 'namespace/running',
              parent: currentNamespace,
              namespace,
              effect: effect as EffectOf<F>,
            }),
            M.chain(() => effect),
            chainF((value) =>
              sendEvent({
                type: 'namespace/completed',
                parent: currentNamespace,
                namespace,
                effect: effect as EffectOf<F>,
                value,
              }),
            ),
          )
        }),
      ) as HKT2<F, WidenI<E | Shared<F>>, A>
    }
  }
}
