import * as Effect from '@effect/core/io/Effect'
import { RefSym } from '@effect/core/io/Ref'
import { identity, pipe } from '@tsplus/stdlib/data/Function'
import { Maybe, none } from '@tsplus/stdlib/data/Maybe'
import { Fx, RefSubject, filterMap, makeRefSubject } from '@typed/fx'

import { DomSource } from '../DOM/DomSource.js'

import { Placeholder } from './Placeholder.js'

export interface ElementRef<A extends HTMLElement>
  extends RefSubject<never, Maybe<A>>,
    DomSource<A>,
    Placeholder {
  readonly element: Fx<never, never, A>
}

export function makeElementRef<A extends HTMLElement = HTMLElement>(): Effect.Effect<
  never,
  never,
  ElementRef<A>
> {
  return pipe(
    makeRefSubject<Maybe<A>>(() => none),
    Effect.map((subject) => {
      const element = pipe(subject, filterMap(identity))
      return {
        ...subject,
        ...DomSource(element),
        element,
      } as ElementRef<A>
    }),
  )
}

export function isElementRef<A extends HTMLElement = HTMLElement>(
  value: unknown,
): value is ElementRef<A> {
  return value !== null && typeof value === 'object' && RefSym in value && 'source' in value
}
