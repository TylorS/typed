import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { Namespace } from '@typed/fp/Namespace'
import {
  Provider,
  Provider2,
  Provider3,
  Provider4,
  ProvideSome,
  ProvideSome2,
  UseAll,
} from '@typed/fp/Provide'
import { ProvideSome3, ProvideSome4 } from '@typed/fp/Provide/Provide'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import {
  DeleteShared,
  DeleteShared2,
  DeleteShared3,
  DeleteShared4,
  GetShared,
  GetShared2,
  GetShared3,
  GetShared4,
  SetShared,
  SetShared2,
  SetShared3,
  SetShared4,
} from '../Shared'
import { createDeleteShared } from './createDeleteShared'
import { createGetShared } from './createGetShared'
import { createSetShared } from './createSetShared'
import { GlobalNamespace } from './global'
import { createRuntimeEnv, RuntimeEnv } from './RuntimeEnv'

export function provideRuntime<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & ProvideSome2<F>,
): (
  options?: RuntimeOptions<F>,
) => Provider2<F, GetShared2<F> & SetShared2<F> & DeleteShared2<F> & RuntimeEnv<F>, never>

export function provideRuntime<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & ProvideSome3<F>,
): <E = never>(
  options?: RuntimeOptions<F>,
) => Provider3<F, GetShared3<F> & SetShared3<F> & DeleteShared3<F> & RuntimeEnv<F>, never, E>

export function provideRuntime<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & ProvideSome4<F>,
): <R = never, E = never>(
  options?: RuntimeOptions<F>,
) => Provider4<F, GetShared4<F> & SetShared4<F> & DeleteShared4<F> & RuntimeEnv<F>, never, R, E>

export function provideRuntime<F>(
  M: MonadAsk<F> & FromIO<F> & ProvideSome<F> & UseAll<F>,
): (options?: RuntimeOptions<F>) => Provider<F>

export function provideRuntime<F>(M: MonadAsk<F> & FromIO<F> & ProvideSome<F>) {
  const getShared = createGetShared(M)
  const setShared = createSetShared(M)
  const deleteShared = createDeleteShared(M)

  return (options: RuntimeOptions<F>) => {
    const { namespace = GlobalNamespace, runtimeEnv = createRuntimeEnv<F>(namespace) } = options
    const runtime: RuntimeEnv<F> & GetShared<F> & SetShared<F> & DeleteShared<F> = {
      ...runtimeEnv,
      getShared: (shared) => pipe(getShared(shared), M.provideSome(runtimeEnv)),
      setShared: (value) => (shared) => pipe(shared, setShared(value), M.provideSome(runtimeEnv)),
      deleteShared: (shared) => pipe(shared, deleteShared, M.provideSome(runtimeEnv)),
    }

    return <A>(effect: HKT<F, A>): HKT<F, A> => M.provideSome(runtime)(effect)
  }
}

export type RuntimeOptions<F> = {
  readonly namespace?: Namespace
  readonly runtimeEnv?: RuntimeEnv<F>
}
