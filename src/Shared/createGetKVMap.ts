import { MonadReader, MonadReader2, MonadReader3, MonadReader3C } from '@typed/fp/MonadReader'
import { getCurrentNamespace as getCurrentNamespace_ } from '@typed/fp/Namespace'
import { FromIO, FromIO2, FromIO3, FromIO3C } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, URIS2, URIS3 } from 'fp-ts/dist/HKT'

import { createGetOrCreateNamespace } from './createGetOrCreateNamespace'
import { Shared } from './Shared'

export function createGetKVMap<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): Kind2<F, Shared<F>, Map<any, any>>

export function createGetKVMap<F extends URIS3, E = never>(
  M: MonadReader3<F> & FromIO3<F>,
): Kind3<F, Shared<F>, E, Map<any, any>>

export function createGetKVMap<F extends URIS3, E = never>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): Kind3<F, Shared<F>, E, Map<any, any>>

export function createGetKVMap<F, E = never>(
  M: MonadReader<F> & FromIO<F>,
): HKT2<F, E, Map<any, any>>

export function createGetKVMap<F>(M: MonadReader<F> & FromIO<F>) {
  const getCurrentNamespace = getCurrentNamespace_(M)
  const getOrCreateNamespace = createGetOrCreateNamespace(M)

  return pipe(getCurrentNamespace(), M.chain(getOrCreateNamespace))
}
