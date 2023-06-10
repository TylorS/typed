import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { DomSource } from '@typed/dom/DomSource'
import * as Fx from '@typed/fx'
import { type EffectGenErrors, type EffectGenResources, isRefSubject } from '@typed/fx'

import type { Placeholder } from './Placeholder.js'
import type { Rendered } from './render.js'

export interface ElementRef<A extends Rendered>
  extends Fx.RefSubject<never, Option.Option<A>>,
    DomSource<A>,
    Placeholder<never, never, Option.Option<A>> {
  readonly element: Fx.Filtered<never, never, A>
}

const initial = Effect.sync(Option.none)
const strictEqual = Option.getEquivalence((a, b) => a === b)

export function makeElementRef<A extends Rendered = HTMLElement>(): Effect.Effect<
  Scope.Scope,
  never,
  ElementRef<A>
> {
  return Effect.map(Scope.Scope, (scope) => unsafeMakeElementRef<A>(scope))
}

export function unsafeMakeElementRef<A extends Rendered = HTMLElement>(
  scope: Scope.Scope,
): ElementRef<A> {
  const subject = Fx.RefSubject.unsafeMake<never, Option.Option<A>>(initial, scope, strictEqual)
  const element: Fx.Filtered<never, never, A> = subject.filterMap((x) => x)

  return Object.assign(subject, DomSource.make(element), { element })
}

export function withElementRef<T extends HTMLElement = HTMLElement>() {
  return <Eff extends Effect.EffectGen<any, any, any>, R, E, A, N = unknown>(
    f: (adapter: Effect.Adapter, ref: ElementRef<T>) => Generator<Eff, Fx.Fx<R, E, A>, N>,
  ): Fx.Fx<R | Scope.Scope | EffectGenResources<Eff>, E | EffectGenErrors<Eff>, A> =>
    Fx.gen(function* ($) {
      const ref = yield* $(makeElementRef<T>())

      return yield* f($, ref)
    })
}

export function isElementRef<A extends HTMLElement = HTMLElement>(
  value: unknown,
): value is ElementRef<A> {
  return isRefSubject(value) && 'element' in value
}
