import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { pipe } from 'fp-ts/dist/function'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { none, some } from 'fp-ts/dist/Option'
import { filterMapWithIndex } from 'fp-ts/dist/ReadonlyArray'

import { RuntimeHandler } from './listenToEvents'
import { RuntimeEnv } from './RuntimeEnv'
import { EffectOf, NamespaceDeleted, NamespaceStarted, SharedEvent } from './SharedEvent'

export type CoreHandlers<F> = readonly [
  RuntimeHandler<F, NamespaceDeleted>,
  RuntimeHandler<F, NamespaceStarted<F>>,
]

const isNamespaceDeleted = <F>(event: SharedEvent<F>): event is NamespaceDeleted =>
  event.type === 'namespace/deleted'

const isNamespaceStarted = <F>(event: SharedEvent<F>): event is NamespaceStarted<F> =>
  event.type === 'namespace/started'

export function createCoreHandlers<F extends URIS2>(M: MonadAsk2<F>): CoreHandlers<F>

export function createCoreHandlers<F extends URIS3>(M: MonadAsk3<F>): CoreHandlers<F>

export function createCoreHandlers<F extends URIS4>(M: MonadAsk4<F>): CoreHandlers<F>

export function createCoreHandlers<F>(M: MonadAsk<F>): CoreHandlers<F>

export function createCoreHandlers<F>(M: MonadAsk<F>): CoreHandlers<F> {
  // Ensure resources are cleaned up after deleting a namespace
  const onDeleteNamespace: RuntimeHandler<F, NamespaceDeleted> = {
    guard: isNamespaceDeleted,
    handler: (event) =>
      pipe(
        M.ask<RuntimeEnv<F>>(),
        M.map((env) => {
          env.sharedEffects.delete(event.namespace)
          env.sharedKeyStore.delete(event.namespace)

          // Delete queued effects
          const indexesToRemove = pipe(
            env.queuedEffects,
            filterMapWithIndex((i, [namespace]) =>
              namespace === event.namespace ? some(i) : none,
            ),
          )

          let offset = 0
          for (const index of indexesToRemove) {
            env.queuedEffects.splice(index + offset, 1)
            offset++
          }
        }),
      ) as EffectOf<F, RuntimeEnv<F>>,
  }

  const onNamespaceStarted: RuntimeHandler<F, NamespaceStarted<F>> = {
    guard: isNamespaceStarted,
    handler: (event) =>
      pipe(
        M.ask<RuntimeEnv<F>>(),
        M.map((env) => {
          env.sharedEffects.set(event.namespace, event.effect)
        }),
      ) as EffectOf<F, RuntimeEnv<F>>,
  }

  return [onDeleteNamespace, onNamespaceStarted] as const
}
