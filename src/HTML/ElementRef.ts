import { Effect } from '@effect/core/io/Effect'
import { Ref, RefSym, makeRef } from '@effect/core/io/Ref'
import { Maybe, none } from '@tsplus/stdlib/data/Maybe'

import { Placeholder } from './Placeholder.js'

export interface ElementRef<A extends HTMLElement> extends Ref<Maybe<A>>, Placeholder {}

export function makeElementRef<A extends HTMLElement = HTMLElement>(): Effect<
  never,
  never,
  ElementRef<A>
> {
  return makeRef<Maybe<A>>(() => none) as Effect<never, never, ElementRef<A>>
}

export function isElementRef<A extends HTMLElement = HTMLElement>(
  value: unknown,
): value is ElementRef<A> {
  return value !== null && typeof value === 'object' && RefSym in value
}
