import type { Cause } from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Scope from "@effect/io/Scope"
import { Commit, fromSink } from "@typed/fx/internal/core2"
import type { Fx, Subject } from "@typed/fx/internal/core2"
import type { Sink } from "@typed/fx/internal/sink"

export function makeSubject<E, A>(): Subject<never, E, A> {
  return new SubjectImpl<E, A>()
}

class SubjectImpl<E, A> extends Commit<never, E, A> implements Subject<never, E, A> {
  private sinks: Set<Sink<E, A>> = new Set()

  // Emit a failure to all sinks
  onFailure = (cause: Cause<E>) => Effect.forEach(this.sinks, (sink) => sink.onFailure(cause))

  // Emit an event to all sinks
  onSuccess = (a: A) => Effect.forEach(this.sinks, (sink) => sink.onSuccess(a))

  commit(): Fx<never, E, A> {
    return fromSink<never, E, A>((sink) =>
      Effect.acquireUseRelease(
        Scope.make(),
        (scope) => this.addSink(sink).pipe(Effect.provideService(Scope.Scope, scope), Effect.zipRight(Effect.never)),
        (scope, exit) => Scope.close(scope, exit)
      )
    )
  }

  private addSink(sink: Sink<E, A>): Effect.Effect<Scope.Scope, never, number> {
    return Effect.acquireRelease(
      Effect.sync(() => {
        this.sinks.add(sink)

        return this.sinks.size
      }),
      () => Effect.sync(() => this.sinks.delete(sink))
    )
  }
}
