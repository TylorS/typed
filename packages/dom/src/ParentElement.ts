import * as Effect from '@effect/io/Effect'
import * as T from '@fp-ts/data/Context'
import { flow } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import * as Fx from '@typed/fx'

import { dispatchEventWith } from './EventTarget.js'
import { GlobalThis } from './GlobalThis.js'

export interface ParentElement {
  readonly parentElement: ParentNode & HTMLElement
}

export namespace ParentElement {
  export const Tag: T.Tag<ParentElement> = T.Tag<ParentElement>()

  export const access = Effect.serviceWith(Tag)
  export const accessEffect = Effect.serviceWithEffect(Tag)
  export const accessFx = Fx.serviceWithFx(Tag)

  export const provide = Effect.provideService(Tag)
}

export const getParentElement: Effect.Effect<ParentElement, never, ParentElement> = Effect.service(
  ParentElement.Tag,
)

export const querySelector: <A extends HTMLElement>(
  selector: string,
) => Effect.Effect<ParentElement, never, Option.Option<A>> = <A extends HTMLElement>(
  selector: string,
) => ParentElement.access((p) => Option.fromNullable(p.parentElement.querySelector<A>(selector)))

export const querySelectorAll: <A extends HTMLElement>(
  selector: string,
) => Effect.Effect<ParentElement, never, ReadonlyArray<A>> = <A extends HTMLElement>(
  selector: string,
) =>
  ParentElement.access(
    (p): ReadonlyArray<A> => Array.from(p.parentElement.querySelectorAll<A>(selector)),
  )

export const dispatchEvent = <EventName extends keyof HTMLElementEventMap>(
  event: EventName,
  options?: EventInit,
): Effect.Effect<GlobalThis | ParentElement, never, boolean> =>
  ParentElement.accessEffect(flow((p) => p.parentElement, dispatchEventWith(event, options)))
