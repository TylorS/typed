import * as Effect from '@effect/io/Effect'
import * as T from '@fp-ts/data/Context'
import * as Fx from '@typed/fx'

import { addEventListener } from './EventTarget.js'

export interface Window extends globalThis.Window {}

export namespace Window {
  export const Tag: T.Tag<Window> = T.Tag<Window>()

  export const access = Effect.serviceWith(Tag)
  export const accessEffect = Effect.serviceWithEffect(Tag)
  export const accessFx = Fx.serviceWithFx(Tag)

  export const provide = Effect.provideService(Tag)
}

export const getWindow: Effect.Effect<Window, never, Window> = Effect.service(Window.Tag)

export const getInnerWidth: Effect.Effect<Window, never, number> = Window.access(
  (w) => w.innerWidth,
)

export const getInnerHeight: Effect.Effect<Window, never, number> = Window.access(
  (w) => w.innerHeight,
)

export const getComputedStyle = (el: Element) =>
  Window.accessEffect((w) => Effect.sync(() => w.getComputedStyle(el)))

export const addWindowListener = <EventName extends keyof WindowEventMap>(
  event: EventName,
  options?: AddEventListenerOptions,
) => Window.accessFx(addEventListener(event, options))
