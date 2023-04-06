import { Mutable } from '@typed/fx/internal/Mutable'
import type { Scope } from '@typed/fx/internal/_externals'
import { Effect, Option } from '@typed/fx/internal/_externals'
import { never } from '@typed/fx/internal/constructor/never'
import { HoldFx } from '@typed/fx/internal/operator/hold'
import type { Subject } from '@typed/fx/internal/subject/Subject'

export interface HoldSubject<in out E, in out A> extends Subject<E, A> {
  readonly current: Mutable<Option.Option<A>>
}

export function makeHoldSubject<E, A>(): Effect.Effect<never, never, HoldSubject<E, A>> {
  return Effect.sync(() => HoldSubject.unsafeMake(Mutable(Option.none<A>())))
}

export function makeScopedHoldSubject<E, A>(): Effect.Effect<
  Scope.Scope,
  never,
  HoldSubject<E, A>
> {
  return Effect.gen(function* ($) {
    const subject = yield* $(makeHoldSubject<E, A>())

    yield* $(Effect.addFinalizer(subject.end))

    return subject
  })
}

export namespace HoldSubject {
  export const unsafeMake = <E, A>(current: Mutable<Option.Option<A>>): HoldSubject<E, A> =>
    new HoldSubjectImpl<E, A, 'HoldSubject'>(current, 'HoldSubject')
}

/**
 * @internal
 */
export class HoldSubjectImpl<E, A, Tag extends string>
  extends HoldFx<never, E, A, Tag>
  implements HoldSubject<E, A>
{
  constructor(current: Mutable<Option.Option<A>>, tag: Tag) {
    super(never, current, tag, true)
  }
}
