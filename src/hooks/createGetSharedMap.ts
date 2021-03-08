import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk3C } from '@typed/fp/MonadAsk'
import { getCurrentNamespace as getCurrentNamespace_ } from '@typed/fp/Namespace'
import { FromIO, FromIO2, FromIO3, FromIO3C } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, URIS2, URIS3 } from 'fp-ts/dist/HKT'
import { UseSome, UseSome2, UseSome3, UseSome3C } from '../Provide'
import { createGetOrCreateNamespace, RuntimeEnv } from '../Shared'

export function createGetSharedMap<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): Kind2<F, RuntimeEnv<F>, Map<any, any>>

export function createGetSharedMap<F extends URIS3, E = never>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): Kind3<F, RuntimeEnv<F>, E, Map<any, any>>

export function createGetSharedMap<F extends URIS3, E = never>(
  M: MonadAsk3C<F, E> & FromIO3C<F, E> & UseSome3C<F, E>,
): Kind3<F, RuntimeEnv<F>, E, Map<any, any>>

export function createGetSharedMap<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): HKT<F, Map<any, any>>

export function createGetSharedMap<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  const getCurrentNamespace = getCurrentNamespace_(M)
  const getOrCreateNamespace = createGetOrCreateNamespace(M)

  return pipe(getCurrentNamespace(), M.chain(getOrCreateNamespace))
}
