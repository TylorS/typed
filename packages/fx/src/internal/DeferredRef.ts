import { MutableRef } from "effect"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import type * as Equivalence from "effect/Equivalence"
import * as Exit from "effect/Exit"
import type * as FiberId from "effect/FiberId"
import * as Option from "effect/Option"
import { EffectBase } from "./protos.js"

export class DeferredRef<E, A> extends EffectBase<A, E, never> {
  // Keep track of the latest value emitted by the stream
  public version!: number
  public deferred!: Deferred.Deferred<A, E>

  constructor(
    private id: FiberId.FiberId,
    private eq: Equivalence.Equivalence<Exit.Exit<A, E>>,
    readonly current: MutableRef.MutableRef<Option.Option<Exit.Exit<A, E>>>
  ) {
    super()
    this.reset()
  }

  toEffect() {
    return Effect.suspend(() => {
      const current = MutableRef.get(this.current)
      if (Option.isNone(current)) {
        return Deferred.await(this.deferred)
      } else {
        return current.value
      }
    })
  }

  done(exit: Exit.Exit<A, E>) {
    const current = MutableRef.get(this.current)

    MutableRef.set(this.current, Option.some(exit))

    if (Option.isSome(current) && this.eq(current.value, exit)) {
      return false
    }

    Deferred.unsafeDone(this.deferred, exit)
    this.version += 1

    return true
  }

  reset() {
    MutableRef.set(this.current, Option.none())
    this.version = -1

    if (this.deferred) {
      Deferred.unsafeDone(this.deferred, Exit.interrupt(this.id))
    }

    this.deferred = Deferred.unsafeMake(this.id)
  }
}

export function make<E, A>(eq: Equivalence.Equivalence<Exit.Exit<A, E>>) {
  return Effect.map(Effect.fiberId, (id) => new DeferredRef(id, eq, MutableRef.make(Option.none())))
}

export function unsafeMake<E, A>(
  id: FiberId.FiberId,
  eq: Equivalence.Equivalence<Exit.Exit<A, E>>,
  current: MutableRef.MutableRef<Option.Option<Exit.Exit<A, E>>>
) {
  return new DeferredRef(id, eq, current)
}
