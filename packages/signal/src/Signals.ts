import { Tagged } from "@typed/context"
import type { Signal } from "./Signal.js"

export interface Signals {
  readonly dependents: Map<Signal.Any, Set<Signal.Any>>
  readonly dependencies: Map<Signal.Any, Set<Signal.Any>>
  readonly versions: Map<Signal.Any, number>
}

export const Signals: Tagged<Signals> = Tagged<Signals>("@typed/signal/Signals")
