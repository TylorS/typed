import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { pipe } from 'fp-ts/dist/function'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { RuntimeHandler } from './listenToEvents'
import { RuntimeEnv } from './RuntimeEnv'
import { EffectOf, NamespaceDeleted, SharedEvent } from './SharedEvent'

export function createCoreHandlers<F extends URIS2>(
  M: MonadAsk2<F>,
): readonly [RuntimeHandler<F, NamespaceDeleted>]

export function createCoreHandlers<F extends URIS3>(
  M: MonadAsk3<F>,
): readonly [RuntimeHandler<F, NamespaceDeleted>]

export function createCoreHandlers<F extends URIS4>(
  M: MonadAsk4<F>,
): readonly [RuntimeHandler<F, NamespaceDeleted>]

export function createCoreHandlers<F>(
  M: MonadAsk<F>,
): readonly [RuntimeHandler<F, NamespaceDeleted>]

export function createCoreHandlers<F>(M: MonadAsk<F>) {
  // Ensure resources are cleaned up after deleting a namespace
  const onDeleteNamespace: RuntimeHandler<F, NamespaceDeleted> = {
    guard: (event: SharedEvent<F>): event is NamespaceDeleted => event.type === 'namespace/deleted',
    handler: (event) =>
      pipe(
        M.ask<RuntimeEnv<F>>(),
        M.map((env) => {
          env.sharedEffects.delete(event.namespace)
          env.sharedKeyStore.delete(event.namespace)
        }),
      ) as EffectOf<F, RuntimeEnv<F>>,
  }

  return [onDeleteNamespace] as const
}
