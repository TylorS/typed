import * as Effect from "effect/Effect";
import { EventHandler } from "@typed/template";
import type { EventHandlerInput, EventHandlerProperty } from "./Types.js";

/**
 * Combines a user handler with component-required behavior for one native event.
 *
 * @remarks
 * ## Why
 * Component hosts must combine user and required behavior without hiding the
 * precise Effect boundary. User callback invocation constructs the user Effect
 * first. Internal callback invocation may then construct an internal Effect;
 * only execution of that returned Effect is sequenced after the user Effect.
 *
 * ## Ownership and lifetime
 * The returned `EventHandler` owns no listener by itself. The rendering Scope
 * installs it and removes it; `once` and AbortSignal state are honored for each
 * input independently. Capture and passive options are conservatively merged.
 *
 * ## DOM behavior
 * The user handler receives a retained `Proxy` around the browser event so a
 * `preventDefault()` call made while its Effect runs can still cancel the
 * internal step. The proxy is not identity-equal to the native event. Its
 * properties—including `currentTarget`—are read from that native event, so
 * `currentTarget` becomes null after browser dispatch exactly as it normally
 * does. The internal handler receives the original native event, never the
 * proxy.
 *
 * ## Invocation and Effect sequencing
 * `userHandler.handler(proxy)` is called first to construct `userEffect`. If
 * that invocation has already called `preventDefault()`—for example through an
 * EventHandler option—the internal handler is not invoked. Otherwise,
 * `internalHandler.handler(nativeEvent)` is called immediately to construct
 * `internalEffect`, before `userEffect` runs. A void-returning internal callback
 * therefore performs its callback body eagerly and cannot be undone by a later
 * `preventDefault()` inside `userEffect`. The composed Effect runs `userEffect`,
 * checks tracked default prevention again, and only then runs a returned
 * `internalEffect` when it is still allowed.
 *
 * @example
 * ```ts
 * import { chainEvent } from "@typed/ui/Dom/Events"
 * import { EventHandler } from "@typed/template"
 * import { Effect } from "effect"
 *
 * const calls: Array<string> = []
 * const handler = chainEvent(
 *   EventHandler.make((event: MouseEvent) =>
 *     Effect.sync(() => {
 *       calls.push("user effect")
 *       event.preventDefault()
 *     })),
 *   EventHandler.make(() => {
 *     calls.push("internal callback") // runs while constructing the Effect
 *     return Effect.sync(() => calls.push("internal effect"))
 *   })
 * )!
 *
 * const program = handler.handler(new MouseEvent("click", { cancelable: true }))
 * // calls is now ["internal callback"]
 * await Effect.runPromise(program)
 * // calls is ["internal callback", "user effect"];
 * // the returned internal Effect was gated by preventDefault.
 * ```
 *
 * @since 1.0.0
 * @category Event composition
 */
export function chainEvent<Ev extends Event, E1 = never, R1 = never, E2 = never, R2 = never>(
  user: EventHandlerInput<Ev, E1, R1>,
  internal: EventHandlerInput<Ev, E2, R2>,
): EventHandler.EventHandler<Ev, E1 | E2, R1 | R2> | undefined {
  const userHandler = toEventHandler(user);
  const internalHandler = toEventHandler(internal);
  if (!userHandler) return internalHandler;
  if (!internalHandler) return userHandler;

  let userActive = true;
  let internalActive = true;
  const passive =
    userHandler.options?.preventDefault === true ||
    internalHandler.options?.preventDefault === true ||
    userHandler.options?.passive === false ||
    internalHandler.options?.passive === false
      ? false
      : (userHandler.options?.passive ?? internalHandler.options?.passive);
  const options = {
    capture: userHandler.options?.capture ?? internalHandler.options?.capture,
    passive,
  };
  return EventHandler.make((event: Ev) => {
    const tracked = trackPreventDefault(event);
    const userEffect =
      userActive && userHandler.options?.signal?.aborted !== true
        ? userHandler.handler(tracked.event)
        : Effect.void;
    if (userActive && userHandler.options?.signal?.aborted !== true) {
      if (userHandler.options?.once === true) userActive = false;
    }
    if (
      tracked.defaultPrevented() ||
      !internalActive ||
      internalHandler.options?.signal?.aborted === true
    ) {
      return userEffect;
    }

    if (internalHandler.options?.once === true) internalActive = false;
    const internalEffect = internalHandler.handler(event);
    return Effect.andThen(userEffect, () =>
      tracked.defaultPrevented() ? Effect.void : internalEffect,
    );
  }, options);
}

function trackPreventDefault<Ev extends Event>(
  event: Ev,
): {
  readonly event: Ev;
  readonly defaultPrevented: () => boolean;
} {
  let defaultPrevented = event.defaultPrevented;
  return {
    event: new Proxy(event, {
      get(target, property) {
        if (property === "defaultPrevented") return defaultPrevented;
        if (property === "preventDefault") {
          return () => {
            defaultPrevented = true;
            event.preventDefault();
          };
        }
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      },
    }),
    defaultPrevented: () => defaultPrevented,
  };
}

/**
 * Tests whether a prop name uses Typed's native event conventions.
 *
 * @remarks
 * ## Why
 * Host forwarding and merging treat `on*` and `@*` keys as handlers rather
 * than ordinary attributes.
 *
 * ## Ownership and lifetime
 * Pure predicate; it installs no listener and retains no key.
 *
 * @since 1.0.0
 * @category Event inspection
 */
export function isEventKey(key: string): key is EventHandlerProperty {
  return key[0] === "@" || (key[0] === "o" && key[1] === "n");
}

/**
 * Reads a native event's non-null current target during handler execution.
 *
 * @remarks
 * ## Why
 * The DOM types `currentTarget` as nullable because the browser clears it after
 * dispatch. This helper makes the temporal constraint explicit and preserves a
 * caller-selected target type.
 *
 * ## Ownership and lifetime
 * The returned target is borrowed from the live dispatch. Do not treat it as a
 * component-owned node; the helper throws after the handler window closes.
 *
 * @example
 * ```ts
 * import { currentTarget } from "@typed/ui/Dom/Events"
 *
 * const read = (event: Event) => currentTarget<HTMLInputElement>(event).value
 * ```
 *
 * @since 1.0.0
 * @category Event inspection
 */
export function currentTarget<Target extends EventTarget>(event: Event): Target {
  if (event.currentTarget === null) {
    throw new TypeError(
      "An event handler can only read its current target while handling an event",
    );
  }
  return event.currentTarget as Target;
}

/**
 * Reads the standards-based `ToggleEvent.newState` value when present.
 *
 * @remarks
 * ## Why
 * Popover and details components can follow the browser's real toggle event
 * while remaining usable with DOM libraries whose Event types lag the platform.
 *
 * ## Ownership and lifetime
 * Pure read of the current event; no state or listener is retained.
 *
 * @since 1.0.0
 * @category Event inspection
 */
export function toggleState(event: Event): "open" | "closed" | undefined {
  const value = Reflect.get(event, "newState");
  return value === "open" || value === "closed" ? value : undefined;
}

function toEventHandler<Ev extends Event, E, R>(
  handler: EventHandlerInput<Ev, E, R>,
): EventHandler.EventHandler<Ev, E, R> | undefined {
  return handler == null ? undefined : EventHandler.fromEffectOrEventHandler(handler);
}
