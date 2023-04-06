import { methodWithTrace } from '@effect/data/Debug'
import type * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx, Sink } from '@typed/fx/internal/Fx'

export class EmptyFx extends BaseFx<never, never, never> {
  readonly name = 'Empty'

  run(sink: Sink<never, never>): Effect.Effect<Scope, never, void> {
    return sink.end()
  }
}

const empty_ = new EmptyFx()

export const empty: () => Fx<never, never, never> = methodWithTrace(
  (trace) => () => empty_.traced(trace),
)
