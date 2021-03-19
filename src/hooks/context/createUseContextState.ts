import { KV, KV2, KV3, KV4 } from '@typed/fp/KV'
import { MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import { usingNamespace } from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import { Shared } from '@typed/fp/Shared'
import { WidenI } from '@typed/fp/Widen'
import { ChainRec, ChainRec2, ChainRec3, ChainRec4 } from 'fp-ts/dist/ChainRec'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createGetKVState } from '../createGetKVState'
import { UseState, UseState2, UseState3, UseState4 } from '../UseState'
import { createWithProvider } from './createWithProvider'

export function createUseContextState<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F> & UseSome2<F> & ChainRec2<F>,
): <K, E, A>(shared: KV2<F, K, E, A>) => Kind2<F, WidenI<Shared<F> | E>, UseState2<F, A, A>>

export function createUseContextState<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F> & UseSome3<F> & ChainRec3<F>,
): <K, R, E, A>(
  shared: KV3<F, K, R, E, A>,
) => Kind3<F, WidenI<Shared<F> | R>, E, UseState3<F, A, A, E>>

export function createUseContextState<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F> & UseSome4<F> & ChainRec4<F>,
): <K, S, R, E, A>(
  shared: KV4<F, K, S, R, E, A>,
) => Kind4<F, S, WidenI<Shared<F> | R>, E, UseState4<F, A, A, S, E>>

export function createUseContextState<F>(
  M: MonadReader<F> & FromIO<F> & UseSome<F> & ChainRec<F>,
): <K, E, A>(shared: KV<F, K, E, A>) => HKT2<F, WidenI<Shared<F> | E>, UseState<F, A>>

export function createUseContextState<F>(M: MonadReader<F> & FromIO<F> & UseSome<F> & ChainRec<F>) {
  const withProvider = createWithProvider(M)
  const getKV = createGetKVState(M)
  const using = usingNamespace(M)

  return <K, E, A>(shared: KV<F, K, E, A>) =>
    withProvider(shared, (provider) => pipe(shared, getKV, using(provider))) as HKT2<
      F,
      WidenI<Shared<F> | E>,
      UseState<F, A>
    >
}
