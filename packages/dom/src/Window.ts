import * as Effect from '@effect/io/Effect'
import * as T from '@typed/context'
import type { Fx } from '@typed/fx'

import { addEventListener } from './EventTarget.js'

export interface Window extends globalThis.Window {}
export const Window = T.Tag<Window>('@typed/dom/Window')

export const getInnerWidth: Effect.Effect<Window, never, number> = Window.with((w) => w.innerWidth)

export const getInnerHeight: Effect.Effect<Window, never, number> = Window.with(
  (w) => w.innerHeight,
)

export const getComputedStyle = (el: Element): Effect.Effect<Window, never, CSSStyleDeclaration> =>
  Window.withEffect((w) => Effect.sync(() => w.getComputedStyle(el)))

export const addWindowListener = <EventName extends keyof WindowEventMap>(
  event: EventName,
  options?: AddEventListenerOptions,
): Fx<Window, never, WindowEventMap[EventName]> => Window.withFx(addEventListener(event, options))
