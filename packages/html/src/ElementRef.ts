import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import { DomSource } from '@typed/dom/DomSource'
import * as Fx from '@typed/fx'
import { type EffectGenErrors, type EffectGenResources, isRefSubject } from '@typed/fx'

import type { Placeholder } from './Placeholder.js'

export interface ElementRef<A extends HTMLElement>
  extends Fx.RefSubject<never, Option.Option<A>>,
    DomSource<A>,
    Placeholder {
  readonly element: Fx.Fx<never, never, A>
}

export function makeElementRef<A extends HTMLElement = HTMLElement>(): Effect.Effect<
  never,
  never,
  ElementRef<A>
> {
  return pipe(
    Fx.makeRef<never, never, Option.Option<A>>(Effect.sync(Option.none)),
    Effect.map((subject): ElementRef<A> => {
      const element: Fx.Fx<never, never, A> = pipe(subject, Fx.compact, Fx.skipRepeats, Fx.hold)

      return Object.assign(subject, DomSource.make(element), { element })
    }),
  )
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
  return isRefSubject(value) && 'element' in value
}
