import type { Trace } from "@effect/data/Debug"
import { zipRight } from "@effect/io/Effect"
import { empty } from "@typed/fx/empty"
import type { Fx, Sink } from "@typed/fx/Fx"
import { BaseFx } from "@typed/fx/Fx"

export function fromArray<const T extends ReadonlyArray<any>>(
  array: T,
): Fx<never, never, T[number]> {
  if (array.length === 0) {
    return empty()
  }

  return new FromArray(array)
}

export class FromArray<const T extends ReadonlyArray<any>> extends BaseFx<
  never,
  never,
  T[number]
> {
  constructor(readonly iterable: T, readonly trace?: Trace) {
    super(trace)
  }

  run<R2>(sink: Sink<R2, never, T[number]>) {
    const { iterable, trace } = this
    let effect = sink.event(iterable[0])

    for (let i = 1; i < iterable.length; ++i) {
      effect = zipRight(effect, sink.event(iterable[i]))
    }

    return effect.traced(trace)
  }
}
