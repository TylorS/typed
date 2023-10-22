import { Effectable } from "effect"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import type * as Exit from "effect/Exit"
import * as Option from "effect/Option"

export class DeferredRef<E, A> extends Effectable.Class<never, E, A> {
  // Keep track of the latest value emitted by the stream
  private current: Option.Option<Exit.Exit<E, A>> = Option.none()

  constructor(private deferred: Deferred.Deferred<E, A>) {
    super()
  }

  commit() {
    return Effect.suspend(() => Option.getOrElse(this.current, () => Deferred.await(this.deferred)))
  }

  done(exit: Exit.Exit<E, A>) {
    return Effect.suspend(() => {
      this.current = Option.some(exit)

      return Deferred.done(this.deferred, exit)
    })
  }
}
