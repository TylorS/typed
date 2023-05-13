import { methodWithTrace } from "@effect/data/Debug"
import { unit } from "@effect/io/Effect"
import type { Fx, Sink } from "@typed/fx/Fx"
import { BaseFx } from "@typed/fx/Fx"

const unit_ = unit()

export class Empty extends BaseFx<never, never, never> {
  run<R2>(_: Sink<R2, never, never>) {
    return unit_.traced(this.trace)
  }
}

export const empty: () => Fx<never, never, never> = methodWithTrace(
  (trace) => () => new Empty(trace),
)
