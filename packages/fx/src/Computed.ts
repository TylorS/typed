import type { Trace } from '@effect/data/Debug'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'

import { Filtered, FilteredImpl } from './Filtered.js'
import { RefTransform, RefTransformImpl, RefTransformInput } from './RefTransform.js'
import { switchMapEffect } from './switchMap.js'

export const ComputedTypeId = Symbol.for('@typed/fx/Computed')
export type ComputedTypeId = typeof ComputedTypeId

/**
 * A Computed is essentially a "read-only" RefSubject which allows
 * for mapping over the value using an Effect.
 *
 * It always prefers the latest value so it will utilize switchMap
 * internally when running as an Fx.
 */
export interface Computed<R, E, A> extends RefTransform<R, E, A, R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId

  mapEffect<R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): Computed<R | R2, E | E2, B>

  map<B>(f: (a: A) => B): Computed<R, E, B>

  filterMapEffect<R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ): Filtered<R | R2, E | E2, B>

  filterMap<B>(f: (a: A) => Option.Option<B>): Filtered<R, E, B>

  filter(f: (a: A) => boolean): Filtered<R, E, A>

  filterEffect<R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): Filtered<R | R2, E | E2, A>

  filterNot(f: (a: A) => boolean): Filtered<R, E, A>

  filterNotEffect<R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): Filtered<R | R2, E | E2, A>

  addTrace(trace: Trace): Computed<R, E, A>

  /**
   * @internal
   */
  version(): number
}

export class ComputedImpl<R, E, A, R2, E2, R3, E3, B>
  extends RefTransformImpl<
    R,
    E,
    A,
    R2,
    E2,
    A,
    R | R2 | R3,
    E | E2 | E3,
    B,
    R | R2 | R3,
    E | E2 | E3,
    B
  >
  implements Computed<R | R2 | R3, E | E2 | E3, B>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  constructor(
    input: RefTransformInput<R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, B>,
    trace?: Trace,
  ) {
    super(
      input,
      (fx) => switchMapEffect(fx, f),
      (eff) => Effect.flatMap(eff, f),
      trace,
    )
  }

  mapEffect<R4, E4, C>(
    f: (b: B) => Effect.Effect<R4, E4, C>,
  ): Computed<R | R2 | R3 | R4, E | E2 | E3 | E4, C> {
    return new ComputedImpl(this as Computed<R | R2 | R3, E | E2 | E3, B>, f)
  }

  map<C>(f: (b: B) => C) {
    return this.mapEffect((a) => Effect.sync(() => f(a)))
  }

  filterMapEffect<R4, E4, C>(
    f: (b: B) => Effect.Effect<R4, E4, Option.Option<C>>,
  ): Filtered<R | R2 | R3 | R4, E | E2 | E3 | E4, C> {
    return new FilteredImpl(this, f) as Filtered<R | R2 | R3 | R4, E | E2 | E3 | E4, C>
  }

  filterMap<D>(f: (a: B) => Option.Option<D>) {
    return this.filterMapEffect((a) => Effect.sync(() => f(a)))
  }

  filterEffect<R4, E4>(
    f: (a: B) => Effect.Effect<R4, E4, boolean>,
  ): Filtered<R | R2 | R3 | R4, E | E2 | E3 | E4, B> {
    return this.filterMapEffect((a) =>
      Effect.map(f(a), (b) => (b ? Option.some<B>(a) : Option.none<B>())),
    )
  }

  filter(f: (a: B) => boolean) {
    return this.filterEffect((a) => Effect.sync(() => f(a)))
  }

  filterNotEffect<R4, E4>(
    f: (a: B) => Effect.Effect<R4, E4, boolean>,
  ): Filtered<R | R2 | R3 | R4, E | E2 | E3 | E4, B> {
    return this.filterEffect((a) => Effect.map(f(a), (b) => !b))
  }

  filterNot(f: (a: B) => boolean) {
    return this.filterNotEffect((a) => Effect.sync(() => f(a)))
  }

  addTrace(trace: Trace): Computed<R | R2 | R3, E | E2 | E3, B> {
    return new ComputedImpl(this as Computed<R | R2 | R3, E | E2 | E3, B>, Effect.succeed, trace)
  }
}
