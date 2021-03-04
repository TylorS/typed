import { Adapter, createAdapter } from '@most/adapter'
import { CurrentNamespace, Namespace } from '@typed/fp/Namespace'

import { GlobalNamespace } from './global'
import { EffectOf, SharedEvent } from './SharedEvent'

export type RuntimeEnv<F> = CurrentNamespace &
  SharedEventsEnv<F> &
  SharedKeyStoreEnv &
  SharedEffectsEnv<F>

export interface SharedEventsEnv<F> {
  // Send an receive runtime lifecycle events
  readonly sharedEvents: Adapter<SharedEvent<F>, SharedEvent<F>>
}

export interface SharedKeyStoreEnv {
  // A *mutable* map of Namespaces to key-value pairs
  readonly sharedKeyStore: Map<Namespace, Map<unknown, unknown>>
}

export interface SharedEffectsEnv<F> {
  // A *mutable* map of Namespace to the effect associated with running within it.
  readonly sharedEffects: Map<Namespace, EffectOf<F>>
}

export function createRuntimeEnv<F>(namespace: Namespace = GlobalNamespace): RuntimeEnv<F> {
  return {
    currentNamespace: namespace,
    sharedEvents: createAdapter<SharedEvent<F>>(),
    sharedKeyStore: new Map(),
    sharedEffects: new Map(),
  }
}
