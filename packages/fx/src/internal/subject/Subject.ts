import type { Fx, Sink } from '@typed/fx/internal/Fx'
import type { Scope } from '@typed/fx/internal/_externals'
import { Effect } from '@typed/fx/internal/_externals'
import { never } from '@typed/fx/internal/constructor/never'
import { MulticastFx } from '@typed/fx/internal/operator/multicast'

export interface Subject<in out E, in out A> extends Fx<never, E, A>, Sink<E, A> {}

export function makeSubject<E, A>(): Effect.Effect<never, never, Subject<E, A>> {
  return Effect.sync(() => new SubjectImpl())
}

export function makeScopedSubject<E, A>(): Effect.Effect<Scope.Scope, never, Subject<E, A>> {
  return Effect.gen(function* ($) {
    const subject = yield* $(makeSubject<E, A>())

    yield* $(Effect.addFinalizer(subject.end))

    return subject
  })
}

export namespace Subject {
  export const unsafeMake = <E, A>() => new SubjectImpl<E, A>()
}

class SubjectImpl<E, A> extends MulticastFx<never, E, A, 'Subject'> implements Subject<E, A> {
  constructor() {
    super(never, 'Subject', true)
  }
}
