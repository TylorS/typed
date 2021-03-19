import { ask, MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import { usingNamespace } from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import {
  createCoreHandlers,
  EffectOf,
  NamespaceCompleted,
  NamespaceDeleted,
  NamespaceStarted,
  RuntimeEnv,
  RuntimeHandler,
} from '@typed/fp/Shared'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createResetIndex } from './createGetNextIndex'
import { NAMESPACE_DISPOSABLE } from './NamespaceDisposable'

export type HooksHandlers<F> = readonly [
  RuntimeHandler<F, NamespaceDeleted>,
  RuntimeHandler<F, NamespaceStarted<F>>,
  RuntimeHandler<F, NamespaceCompleted<F>>,
]

export function createHooksHandlers<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F> & UseSome2<F>,
): HooksHandlers<F>

export function createHooksHandlers<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F> & UseSome3<F>,
): HooksHandlers<F>

export function createHooksHandlers<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F> & UseSome4<F>,
): HooksHandlers<F>

export function createHooksHandlers<F>(M: MonadReader<F> & FromIO<F> & UseSome<F>): HooksHandlers<F>

export function createHooksHandlers<F>(
  M: MonadReader<F> & FromIO<F> & UseSome<F>,
): HooksHandlers<F> {
  const [coreDeleteNamespace, coreNamespaceStarted, coreNamespaceCompleted] = createCoreHandlers<F>(
    M,
  )
  const resetIndex = createResetIndex<F>(M)()
  const using = usingNamespace(M)

  // Ensure resources are cleaned up after deleting a namespace
  const onDeleteNamespace: RuntimeHandler<F, NamespaceDeleted> = {
    ...coreDeleteNamespace,
    handler: (event) =>
      pipe(
        ask(M)<RuntimeEnv<F>>(),
        M.chain((env) => {
          // Clean up disposable BEFORE cleaning up namespace from "core" handlers
          env.sharedKeyStore.get(event.namespace)?.get(NAMESPACE_DISPOSABLE)?.dispose()

          return coreDeleteNamespace.handler(event) as HKT<F, void>
        }),
      ) as EffectOf<F, RuntimeEnv<F>>,
  }

  const onNamespaceStart: RuntimeHandler<F, NamespaceStarted<F>> = {
    ...coreNamespaceStarted,
    handler: (event) =>
      pipe(
        coreNamespaceStarted.handler(event) as HKT<F, void>,
        M.chain(() => pipe(resetIndex, using(event.namespace))),
      ) as EffectOf<F, RuntimeEnv<F>>,
  }

  return [onDeleteNamespace, onNamespaceStart, coreNamespaceCompleted] as const
}
