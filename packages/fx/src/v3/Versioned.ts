import type { Effect } from "effect"
import type { Fx } from "./Fx"

export interface Versioned<R1, E1, R2, E2, A2, R3, E3, A3> extends Fx<R2, E2, A2>, Effect.Effect<R3, E3, A3> {
  readonly version: Effect.Effect<R1, E1, number>
}

export namespace Versioned {
  /**
   * @category models
   * @since 1.0.0
   */
  export type Unify<T> = T extends
    Versioned<infer R1, infer E1, infer R2, infer E2, infer A2, infer R3, infer E3, infer A3> | infer _
    ? Versioned<R1, E1, R2, E2, A2, R3, E3, A3>
    : never
}
