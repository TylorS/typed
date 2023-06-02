import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { DomSource } from '@typed/dom/DomSource'
import * as Fx from '@typed/fx'
import { type EffectGenErrors, type EffectGenResources, isRefSubject } from '@typed/fx'

import type { Placeholder } from './Placeholder.js'
import { Rendered } from './render.js'

export interface ElementRef<A extends Rendered>
  extends Fx.RefSubject<never, Option.Option<A>>,
    DomSource<A>,
    Placeholder<never, never, Option.Option<A>> {
  readonly element: Fx.Fx<never, never, A>
  readonly getElement: Effect.Effect<never, Cause.NoSuchElementException, A>
}

const initial = Effect.sync(Option.none)
const strictEqual = Option.getEquivalence((a, b) => a === b)

export function makeElementRef<A extends Rendered = HTMLElement>(): Effect.Effect<
  never,
  never,
  ElementRef<A>
> {
  return Effect.sync(() => unsafeMakeElementRef<A>())
}

export function unsafeMakeElementRef<A extends Rendered = HTMLElement>(): ElementRef<A> {
  const subject = Fx.RefSubject.unsafeMake<never, Option.Option<A>>(initial, strictEqual)
  const element: Fx.Fx<never, never, A> = pipe(subject, Fx.compact, Fx.skipRepeats, Fx.hold)
  const getElement = Effect.flatten(subject)

  return Object.assign(subject, DomSource.make(element), { element, getElement })
}

export function withElementRef<T extends HTMLElement = HTMLElement>() {
  return <Eff extends Effect.EffectGen<any, any, any>, R, E, A, N = unknown>(
    f: (adapter: Effect.Adapter, ref: ElementRef<T>) => Generator<Eff, Fx.Fx<R, E, A>, N>,
  ): Fx.Fx<R | EffectGenResources<Eff>, E | EffectGenErrors<Eff>, A> =>
    Fx.gen(function* ($) {
      const ref = yield* $(makeElementRef<T>())

      return yield* f($, ref)
    })
}

export function isElementRef<A extends HTMLElement = HTMLElement>(
  value: unknown,
): value is ElementRef<A> {
  return isRefSubject(value) && 'element' in value && 'getElement' in value
}
