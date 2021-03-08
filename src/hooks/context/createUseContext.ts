import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { usingNamespace } from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import { createGetShared, RuntimeEnv, Shared, Shared2, Shared3, Shared4 } from '@typed/fp/Shared'
import { WidenI } from '@typed/fp/Widen'
import { ChainRec, ChainRec2, ChainRec3, ChainRec4 } from 'fp-ts/dist/ChainRec'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createWithProvider } from './createWithProvider'

export function createUseContext<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F> & ChainRec2<F>,
): <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<RuntimeEnv<F> | E>, A>

export function createUseContext<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F> & ChainRec3<F>,
): <K, R, E, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, WidenI<RuntimeEnv<F> | R>, E, A>

export function createUseContext<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F> & ChainRec4<F>,
): <K, S, R, E, A>(
  shared: Shared4<F, K, S, R, E, A>,
) => Kind4<F, S, WidenI<RuntimeEnv<F> | R>, E, A>

export function createUseContext<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F> & ChainRec<F>,
): <K, A>(shared: Shared<F, K, A>) => HKT<F, A>

export function createUseContext<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F> & ChainRec<F>) {
  const withProvider = createWithProvider(M)
  const getShared = createGetShared(M)
  const using = usingNamespace(M)

  return <K, A>(shared: Shared<F, K, A>) =>
    withProvider(shared, (provider) => pipe(shared, getShared, using(provider)))
}
