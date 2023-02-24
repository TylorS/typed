import { flow } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import type * as Effect from '@effect/io/Effect'
import * as C from '@typed/context'

import { dispatchEventWith } from './EventTarget.js'
import type { GlobalThis } from './GlobalThis.js'

export interface ParentElement {
  readonly parentElement: ParentNode & HTMLElement
}

export const ParentElement = C.Tag<ParentElement>('@typed/dom/ParentElement')

export const querySelector: <A extends HTMLElement>(
  selector: string,
) => Effect.Effect<ParentElement, never, Option.Option<A>> = <A extends HTMLElement>(
  selector: string,
) => ParentElement.with((p) => Option.fromNullable(p.parentElement.querySelector<A>(selector)))

export const querySelectorAll: <A extends HTMLElement>(
  selector: string,
) => Effect.Effect<ParentElement, never, ReadonlyArray<A>> = <A extends HTMLElement>(
  selector: string,
) =>
  ParentElement.with(
    (p): ReadonlyArray<A> => Array.from(p.parentElement.querySelectorAll<A>(selector)),
  )

export const dispatchEvent = <EventName extends keyof HTMLElementEventMap>(
  event: EventName,
  options?: EventInit,
): Effect.Effect<GlobalThis | ParentElement, never, boolean> =>
  ParentElement.withEffect(flow((p) => p.parentElement, dispatchEventWith(event, options)))
