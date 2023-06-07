import type { Trace } from '@effect/data/Debug'
import * as MutableRef from '@effect/data/MutableRef'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'

import type { Fx, Sink } from './Fx.js'
import { Traced } from './Fx.js'
import { MulticastFx } from './multicast.js'

export function hold<R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> {
  return new HoldFx(fx)
}

export class HoldFx<R, E, A> extends MulticastFx<R, E, A> {
  readonly current = MutableRef.make(Option.none<A>())

  constructor(public fx: Fx<R, E, A>) {
    super(fx)
  }

  run<R2>(sink: Sink<R2, E, A>) {
    const current = MutableRef.get(this.current)

    if (Option.isSome(current)) {
      return Effect.flatMap(sink.event(current.value), () => super.run(sink))
    }

    return super.run(sink)
  }

  readonly addTrace = (trace: Trace): Fx<R, E, A> => {
    return hold(Traced<R, E, A>(this.fx, trace))
  }

  event(a: A) {
    return Effect.suspend(() => {
      MutableRef.set(this.current, Option.some(a))

      return super.event(a)
    })
  }
}
