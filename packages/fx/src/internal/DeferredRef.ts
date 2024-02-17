import type { Equivalence, FiberId } from "effect"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Option from "effect/Option"
import { EffectBase } from "./protos.js"

export class DeferredRef<E, A> extends EffectBase<never, E, A> {
  // Keep track of the latest value emitted by the stream
  public current!: Option.Option<Exit.Exit<A, E>>
  public version!: number
  public deferred!: Deferred.Deferred<A, E>

  constructor(private id: FiberId.FiberId, private eq: Equivalence.Equivalence<Exit.Exit<A, E>>) {
    super()
    this.reset()
  }

  toEffect() {
    return Effect.suspend(() => {
      if (Option.isNone(this.current)) {
        return Deferred.await(this.deferred)
      } else {
        return this.current.value
      }
    })
  }

  done(exit: Exit.Exit<A, E>) {
    const current = this.current

    this.current = Option.some(exit)

    if (Option.isSome(current) && this.eq(current.value, exit)) {
      return false
    }

    Deferred.unsafeDone(this.deferred, exit)
    this.version += 1

    return true
  }

  reset() {
    this.current = Option.none()
    this.version = -1

    if (this.deferred) {
      Deferred.unsafeDone(this.deferred, Exit.interrupt(this.id))
    }

    this.deferred = Deferred.unsafeMake(this.id)
  }
}

export function make<E, A>(eq: Equivalence.Equivalence<Exit.Exit<A, E>>) {
  return Effect.map(Effect.fiberId, (id) => new DeferredRef(id, eq))
}

export function unsafeMake<E, A>(id: FiberId.FiberId, eq: Equivalence.Equivalence<Exit.Exit<A, E>>) {
  return new DeferredRef(id, eq)
}
