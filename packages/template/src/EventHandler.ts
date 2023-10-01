import type { Effect } from "effect/Effect"

export const EventHandlerTypeId = Symbol.for("@typed/template/EventHandler")
export type EventHandlerTypeId = typeof EventHandlerTypeId

export interface EventHandler<R, E, Ev extends Event = Event> {
  readonly [EventHandlerTypeId]: EventHandlerTypeId
  readonly handler: (event: Ev) => Effect<R, E, unknown>
  readonly options: AddEventListenerOptions | undefined
}

export function EventHandler<R, E, Ev extends Event>(
  handler: (event: Ev) => Effect<R, E, unknown>,
  options?: AddEventListenerOptions
): EventHandler<R, E, Ev> {
  return {
    [EventHandlerTypeId]: EventHandlerTypeId,
    handler,
    options
  }
}
