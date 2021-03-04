import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { Namespace } from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

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

export function createRuntime<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): (options?: RuntimeOptions) => GetShared2<F> & SetShared2<F> & DeleteShared2<F> & RuntimeEnv<F>

export function createRuntime<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): (options?: RuntimeOptions) => GetShared3<F> & SetShared3<F> & DeleteShared3<F> & RuntimeEnv<F>

export function createRuntime<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F>,
): (options?: RuntimeOptions) => GetShared4<F> & SetShared4<F> & DeleteShared4<F> & RuntimeEnv<F>

export function createRuntime<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): (options?: RuntimeOptions) => GetShared<F> & SetShared<F> & DeleteShared<F> & RuntimeEnv<F>

export function createRuntime<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  return (
    options: RuntimeOptions = {},
  ): GetShared<F> & SetShared<F> & DeleteShared<F> & RuntimeEnv<F> => {
    const { namespace = GlobalNamespace } = options
    const env = createRuntimeEnv<F>(namespace)
    const getShared = createGetShared(M)(env)
    const setShared = createSetShared(M)(env)
    const deleteShared = createDeleteShared(M)(env)

    return {
      ...env,
      getShared,
      setShared,
      deleteShared,
    }
  }
}

export type RuntimeOptions = {
  readonly namespace?: Namespace
}
