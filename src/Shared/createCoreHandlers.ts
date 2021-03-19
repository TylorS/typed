import { ask, MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import { pipe } from 'fp-ts/dist/function'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { none, some } from 'fp-ts/dist/Option'
import { filterMapWithIndex } from 'fp-ts/dist/ReadonlyArray'

import { RuntimeHandler } from './listenToEvents'
import { Shared } from './Shared'
import {
  EffectOf,
  NamespaceCompleted,
  NamespaceDeleted,
  NamespaceStarted,
  SharedEvent,
} from './SharedEvent'

export type CoreHandlers<F> = readonly [
  RuntimeHandler<F, NamespaceDeleted>,
  RuntimeHandler<F, NamespaceStarted<F>>,
  RuntimeHandler<F, NamespaceCompleted<F>>,
]

const isNamespaceDeleted = <F>(event: SharedEvent<F>): event is NamespaceDeleted =>
  event.type === 'namespace/deleted'

const isNamespaceStarted = <F>(event: SharedEvent<F>): event is NamespaceStarted<F> =>
  event.type === 'namespace/started'

const isNamespaceCompleted = <F>(event: SharedEvent<F>): event is NamespaceCompleted<F> =>
  event.type === 'namespace/completed'

export function createCoreHandlers<F extends URIS2>(M: MonadReader2<F>): CoreHandlers<F>

export function createCoreHandlers<F extends URIS3>(M: MonadReader3<F>): CoreHandlers<F>

export function createCoreHandlers<F extends URIS4>(M: MonadReader4<F>): CoreHandlers<F>

export function createCoreHandlers<F>(M: MonadReader<F>): CoreHandlers<F>

export function createCoreHandlers<F>(M: MonadReader<F>): CoreHandlers<F> {
  // Ensure resources are cleaned up after deleting a namespace
  const onDeleteNamespace: RuntimeHandler<F, NamespaceDeleted> = {
    guard: isNamespaceDeleted,
    handler: (event) =>
      pipe(
        ask(M)<Shared<F>>(),
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
      ) as EffectOf<F, Shared<F>>,
  }

  const onNamespaceStarted: RuntimeHandler<F, NamespaceStarted<F>> = {
    guard: isNamespaceStarted,
    handler: (event) =>
      pipe(
        ask(M)<Shared<F>>(),
        M.map((env) => {
          env.sharedEffects.set(event.namespace, event.effect)
        }),
      ) as EffectOf<F, Shared<F>>,
  }

  const onNamespaceCompleted: RuntimeHandler<F, NamespaceCompleted<F>> = {
    guard: isNamespaceCompleted,
    handler: (event) =>
      pipe(
        ask(M)<Shared<F>>(),
        M.map((env) => {
          env.sharedReturnValues.set(event.namespace, event.returnValue)
        }),
      ) as EffectOf<F, Shared<F>>,
  }

  return [onDeleteNamespace, onNamespaceStarted, onNamespaceCompleted] as const
}
