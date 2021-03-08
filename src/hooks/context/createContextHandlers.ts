import { getDo, toMonad } from '@typed/fp/FxT'
import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { usingNamespace } from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import {
  createGetSharedMap,
  createSendSharedEvent,
  EffectOf,
  NamespaceDeleted,
  NamespaceStarted,
  RuntimeEnv,
  RuntimeHandler,
  SharedEvent,
  SharedValueDeleted,
  SharedValueUpdated,
} from '@typed/fp/Shared'
import { ChainRec, ChainRec2, ChainRec3, ChainRec4 } from 'fp-ts/dist/ChainRec'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createHooksHandlers } from '../createHooksHandlers'
import { createAddToTree } from './createAddToTree'
import { createGetNamespaceConsumers } from './NamespaceConsumers'
import { createGetNamespaceProviders } from './NamespaceProviders'

const isSharedValueUpdated = <F>(event: SharedEvent<F>): event is SharedValueUpdated<F> =>
  event.type === 'sharedValue/updated'

const isSharedValueDeleted = <F>(event: SharedEvent<F>): event is SharedValueDeleted<F> =>
  event.type === 'sharedValue/deleted'

export type ContextHandlers<F> = readonly [
  RuntimeHandler<F, NamespaceDeleted>,
  RuntimeHandler<F, NamespaceStarted<F>>,
  RuntimeHandler<F, SharedValueUpdated<F>>,
  RuntimeHandler<F, SharedValueDeleted<F>>,
]

export function createContextHandlers<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F> & ChainRec2<F>,
): ContextHandlers<F>

export function createContextHandlers<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F> & ChainRec3<F>,
): ContextHandlers<F>

export function createContextHandlers<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F> & ChainRec4<F>,
): ContextHandlers<F>

export function createContextHandlers<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F> & ChainRec<F>,
): ContextHandlers<F>

export function createContextHandlers<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F> & ChainRec<F>,
): ContextHandlers<F> {
  const getProviders = createGetNamespaceProviders(M)
  const getConsumers = createGetNamespaceConsumers(M)
  const getSharedMap = createGetSharedMap(M)
  const sendSharedEvent = createSendSharedEvent(M)
  const Do = getDo<F>()
  const toM = toMonad<F>(M)
  const using = usingNamespace(M)
  const addToTree = createAddToTree(M)

  const [hooksNamespaceDeleted, hooksNamespaceStarted] = createHooksHandlers<F>(M)

  const contextNamespaceDeleted: RuntimeHandler<F, NamespaceDeleted> = {
    ...hooksNamespaceDeleted,
    handler: (event) =>
      pipe(
        toM(
          Do(function* (_) {
            yield* _(hooksNamespaceDeleted.handler(event) as HKT<F, void>)

            // Delete all consumers using this namespace being deleted
            const providers = yield* _(getProviders)

            for (const provider of providers) {
              const consumers = yield* pipe(getConsumers, using(provider), _)

              consumers.forEach((m) => m.delete(event.namespace))
            }
          }),
        ),
        using(event.namespace),
      ) as EffectOf<F, RuntimeEnv<F>>,
  }

  const contextNamespaceStarted: RuntimeHandler<F, NamespaceStarted<F>> = {
    ...hooksNamespaceStarted,
    handler: (event) =>
      pipe(
        toM(
          Do(function* (_) {
            yield* pipe(event, hooksNamespaceStarted.handler, (x) => _(x as HKT<F, void>))

            yield* pipe(event.parent, addToTree, using(event.namespace), _)
          }),
        ),
      ) as EffectOf<F, RuntimeEnv<F>>,
  }

  const contextSharedValueUpdated: RuntimeHandler<F, SharedValueUpdated<F>> = {
    guard: isSharedValueUpdated,
    handler: (event) =>
      pipe(
        Do(function* (_) {
          // Mark consumers of a given namespace as updated when a context value changes
          const { shared, previousValue, value } = event
          const consumers = yield* _(getConsumers)
          const consumersOfKey = consumers.get(shared.key)
          const sharedMap = yield* _(getSharedMap)

          if (!consumersOfKey || !sharedMap) {
            return
          }

          for (const [namespace, consumers] of consumersOfKey) {
            for (const consumer of consumers) {
              if (!consumer.equals(previousValue)(value)) {
                yield* _(sendSharedEvent({ type: 'namespace/updated', namespace }))

                // Only need one consumer to be mark namespace updated
                break
              }
            }
          }
        }),
        toM,
        using(event.namespace),
      ) as EffectOf<F, RuntimeEnv<F>>,
  }

  const contextSharedValueDeleted: RuntimeHandler<F, SharedValueDeleted<F>> = {
    guard: isSharedValueDeleted,
    handler: (event) =>
      pipe(
        Do(function* (_) {
          // Remove consumers of a given namespace's shared value when it has been deleted
          const { shared, namespace } = event
          const consumers = yield* _(getConsumers)
          const consumersOf = consumers.get(shared.key)

          consumers.delete(shared.key)

          if (consumersOf) {
            for (const consumer of consumersOf.keys()) {
              const providers = yield* pipe(getProviders, using(consumer), _)

              providers.delete(namespace)
            }
          }
        }),
        toM,
        using(event.namespace),
      ) as EffectOf<F, RuntimeEnv<F>>,
  }

  return [
    contextNamespaceDeleted,
    contextNamespaceStarted,
    contextSharedValueUpdated,
    contextSharedValueDeleted,
  ] as const
}
