import * as Effect from '@effect/io/Effect'
import { identity, pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import { DomSource } from '@typed/dom/DomSource'
import * as Fx from '@typed/fx'
import { isRefSubject } from '@typed/fx'

import { Placeholder } from './Placeholder.js'

export interface ElementRef<A extends HTMLElement>
  extends Fx.RefSubject<Option.Option<A>>,
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
    Fx.makeRef<Option.Option<A>>(() => Option.none),
    Effect.map((subject): ElementRef<A> => {
      const element: Fx.Fx<never, never, A> = pipe(subject, Fx.compact, Fx.skipRepeats, Fx.hold)

      return {
        __Placeholder__: {
          _R: identity,
          _E: identity,
        },
        ...subject,
        ...DomSource(element),
        element,
      }
    }),
  )
}

export function isElementRef<A extends HTMLElement = HTMLElement>(
  value: unknown,
): value is ElementRef<A> {
  return isRefSubject(value) && 'element' in value
}
