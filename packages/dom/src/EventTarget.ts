/**
 * Low-level Effect wrappers for EventTarget APIs.
 * @since 8.19.0
 */

import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Scope from "effect/Scope"

import { GlobalThis } from "./GlobalThis.js"
import { createScopedRuntime, type DefaultEventMap } from "./internal/_helpers.js"

/**
 * Add an event listener to an EventTarget
 * @since 8.19.0
 * @category events
 */
export interface AddEventListenerOptions<T extends EventTarget, EventName extends string, R2>
  extends globalThis.AddEventListenerOptions
{
  readonly eventName: EventName

  readonly handler: (
    event: EventWithCurrentTarget<T, EventName extends keyof DefaultEventMap<T> ? DefaultEventMap<T>[EventName] : Event>
  ) => Effect.Effect<unknown, never, R2>
}

/**
 * Add an event listener to an EventTarget
 * @since 8.19.0
 * @category events
 */
export const addEventListener: {
  <T extends EventTarget, EventName extends string, R = never>(
    options: AddEventListenerOptions<T, EventName, R>
  ): (target: T) => Effect.Effect<void, never, R | Scope.Scope>

  <T extends EventTarget, EventName extends string, R = never>(
    target: T,
    options: AddEventListenerOptions<T, EventName, R>
  ): Effect.Effect<void, never, R | Scope.Scope>
} = dual(
  2,
  function addEventListener<T extends EventTarget, EventName extends string, R = never>(
    target: T,
    options: AddEventListenerOptions<T, EventName, R>
  ) {
    return Effect.gen(function*(_) {
      const { run, scope } = yield* _(createScopedRuntime<R>())
      const listener = (event: Event) => run(options.handler(event as any))
      const removeListener = addEventListener_(target, options.eventName, listener, options)

      yield* _(Scope.addFinalizer(scope, Effect.sync(removeListener)))
    })
  }
)

function addEventListener_(
  target: EventTarget,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: globalThis.AddEventListenerOptions
): () => void {
  target.addEventListener(event, listener, options)

  return () => {
    target.removeEventListener(event, listener, options)
  }
}

/**
 * Dispatch an event from an EventTarget
 * @since 8.19.0
 * @category events
 */
export const dispatchEvent: {
  <T extends EventTarget, EventName extends keyof DefaultEventMap<T>>(
    event: EventName,
    options?: EventInit
  ): (target: T) => Effect.Effect<boolean, never, GlobalThis>

  <T extends EventTarget, EventName extends keyof DefaultEventMap<T>>(
    target: T,
    event: EventName,
    options?: EventInit
  ): Effect.Effect<boolean, never, GlobalThis>
} = dual(3, function dispatchEventWith<
  T extends EventTarget,
  EventName extends keyof DefaultEventMap<T>
>(target: T, event: EventName, options?: EventInit): Effect.Effect<boolean, never, GlobalThis> {
  return GlobalThis.with((globalThis) => target.dispatchEvent(new globalThis.Event(event as string, options)))
})

/**
 * Check to see if a key modifier is being used
 * @since 8.19.0
 * @category events
 */
export function isUsingKeyModifier(event: KeyboardEvent | MouseEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
}

/**
 * Helper for creating an Event that has the target property set.
 * @since 8.19.0
 * @category events
 */
export type EventWithTarget<T, Ev = Event> = Ev & { target: T }

/**
 * Helper for creating an Event that has the currentTarget property set.
 * @since 8.19.0
 * @category events
 */
export type EventWithCurrentTarget<T, Ev = Event> = Ev & { currentTarget: T }
