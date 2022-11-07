import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as T from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

import { addEventListener } from './EventTarget.js'

export namespace Window {
  export const Tag: T.Tag<Window> = T.Tag<Window>()
  export const provide = (win: Window) => Effect.provideService(Tag, win)
}

export const getWindow: Effect.Effect<Window, never, Window> = Effect.service(Window.Tag)

export const getInnerWidth: Effect.Effect<Window, never, number> = pipe(
  getWindow,
  Effect.map((w) => w.innerWidth),
)

export const getInnerHeight: Effect.Effect<Window, never, number> = pipe(
  getWindow,
  Effect.map((w) => w.innerHeight),
)

export const getComputedStyle = (el: Element) =>
  pipe(
    getWindow,
    Effect.flatMap((w) => Effect.sync(() => w.getComputedStyle(el))),
  )

export const addWindowListener = <EventName extends keyof WindowEventMap>(
  event: EventName,
  options?: boolean | AddEventListenerOptions,
) => pipe(getWindow, Fx.fromEffect, Fx.flatMap(addEventListener(event, options)))
