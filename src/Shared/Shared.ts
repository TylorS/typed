import { Adapter, createAdapter } from '@most/adapter'
import { CurrentNamespace, Namespace } from '@typed/fp/Namespace'

import { GlobalNamespace } from '../Global/Global'
import { EffectOf, SharedEvent } from './SharedEvent'

export type Shared<F> = CurrentNamespace &
  SharedEventsEnv<F> &
  SharedKeyStoreEnv &
  SharedEffectsEnv<F>

export interface SharedEventsEnv<F> {
  // Send and receive runtime lifecycle events
  readonly sharedEvents: Adapter<SharedEvent<F>, SharedEvent<F>>
}

export interface SharedKeyStoreEnv {
  // A *mutable* map of Namespaces to key-value pairs
  readonly sharedKeyStore: Map<Namespace, Map<any, any>>
}

export interface SharedEffectsEnv<F> {
  // A *mutable* map of Namespace to the effect associated with running within it.
  readonly sharedEffects: Map<Namespace, EffectOf<F>>

  // A *mutable* map of Namespace to returns values associated with running it.
  readonly sharedReturnValues: Map<Namespace, unknown>

  // A *mutable* map of effects that need to be run by the runtime
  readonly queuedEffects: Array<readonly [Namespace, EffectOf<F>]>
}

export function createShared<F>(namespace: Namespace = GlobalNamespace): Shared<F> {
  return {
    currentNamespace: namespace,
    sharedEvents: createAdapter<SharedEvent<F>>(),
    sharedKeyStore: new Map(),
    sharedEffects: new Map(),
    sharedReturnValues: new Map(),
    queuedEffects: [],
  }
}
