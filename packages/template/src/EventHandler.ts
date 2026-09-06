/**
 * Native DOM event handlers whose callbacks are Effect programs.
 *
 * @remarks
 * ## Why
 *
 * The module namespace groups constructors, channel projections, recovery, and
 * native event-option combinators without introducing a parallel event model.
 *
 * ## Ownership and lifetime
 *
 * Module values are inert descriptions. A rendered template's Scope owns
 * listener registration, handler fibers, interruption, and finalization.
 *
 * @since 1.0.0
 * @category Native event handling
 * @packageDocumentation
 */
import type * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import { hasProperty } from "effect/Predicate";
import type * as Context from "effect/Context";

/**
 * The global symbol used to identify `EventHandler` values across module copies.
 *
 * @remarks
 * ## Why
 *
 * A stable nominal key makes the runtime guard precise without depending on
 * browser event object shape.
 *
 * ## Ownership and lifetime
 *
 * The symbol is process-global metadata. It allocates no listener or resource.
 *
 * @example
 * ```ts
 * import { EventHandlerTypeId } from "@typed/template/EventHandler"
 *
 * const key = EventHandlerTypeId
 * ```
 *
 * @since 1.0.0
 * @category Event handler protocol
 */
export const EventHandlerTypeId = Symbol.for("@typed/template/EventHandler");

/**
 * The nominal type of `EventHandlerTypeId`.
 *
 * @remarks
 * ## Why
 *
 * The literal symbol type prevents structurally similar handler records from
 * satisfying the branded interface accidentally.
 *
 * ## Ownership and lifetime
 *
 * This compile-time facet owns no runtime state.
 *
 * @example
 * ```ts
 * import { EventHandlerTypeId, type EventHandlerTypeId as Id } from "@typed/template/EventHandler"
 *
 * const id: Id = EventHandlerTypeId
 * ```
 *
 * @since 1.0.0
 * @category Event handler protocol
 */
export type EventHandlerTypeId = typeof EventHandlerTypeId;

/**
 * Represents a DOM event handler that returns an Effect.
 *
 * It encapsulates the event handler logic and any options (like `preventDefault`, `once`, etc.)
 * that should be applied when the event is triggered.
 *
 * @remarks
 * ## Why
 *
 * `EventHandler` connects browser event behavior to an Effect program. When
 * installed through `EventSource`, the callback receives a `Proxy` over the
 * native event: properties and bound methods forward to the browser event while
 * `currentTarget` is overridden with the delegated target. The wrapper is not
 * pooled, but it is not object-identical to the native event.
 *
 * ## Ownership and lifetime
 *
 * `make` only describes the handler. A rendered template installs the listener
 * within its Effect Scope and removes it when that rendered part is finalized.
 * Any Effect returned by the callback keeps its error and required-service
 * channels in the `EventHandler<Ev, E, R>` type.
 *
 * ## Event options
 *
 * Native `AddEventListenerOptions` are passed through. Typed's convenience
 * flags call the forwarded native methods before the handler; they do not
 * introduce a separate propagation or default-action system.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as EventHandler from "@typed/template/EventHandler"
 * import { html } from "@typed/template"
 *
 * // Simple event handler
 * const handleClick = EventHandler.make((event: MouseEvent) => {
 *   console.log("Clicked!", event)
 * })
 *
 * // Event handler with Effect
 * const handleSubmit = EventHandler.make((event: SubmitEvent) =>
 *   Effect.gen(function* () {
 *     event.preventDefault()
 *     yield* Effect.sync(() => console.log("Form submitted"))
 *   })
 * )
 *
 * // Use in template
 * const template = html`<button onclick=${handleClick}>Click me</button>`
 * ```
 *
 * @since 1.0.0
 * @category Event handlers
 */
export interface EventHandler<Ev extends Event = Event, E = never, R = never> extends Pipeable {
  /**
   * Nominal evidence used by `isEventHandler`.
   *
   * @remarks
   * ## Why
   *
   * The key prevents arbitrary callback-shaped objects from becoming handlers.
   *
   * ## Ownership and lifetime
   *
   * This field is immutable metadata for the handler description.
   *
   * @since 1.0.0
   * @category Event handlers
   */
  readonly [EventHandlerTypeId]: EventHandlerTypeId;
  /**
   * The Effect program invoked with the supplied event or delegated event proxy.
   *
   * @remarks
   * ## Why
   *
   * The callback preserves typed failures and services while retaining browser
   * event behavior through the delegated proxy.
   *
   * ## Ownership and lifetime
   *
   * The mounted EventSource runs each Effect in a fiber owned by its Scope.
   *
   * @since 1.0.0
   * @category Event work
   */
  readonly handler: (event: Ev) => Effect.Effect<unknown, E, R>;
  /**
   * Native listener options plus Typed's pre-handler event controls.
   *
   * @remarks
   * ## Why
   *
   * Browser capture, passive, signal, propagation, and default behavior stay explicit.
   *
   * ## Ownership and lifetime
   *
   * EventSource reads this immutable record when attaching the listener.
   *
   * @since 1.0.0
   * @category Native listener policy
   */
  readonly options: (AddEventListenerOptions & EventOptions) | undefined;
}

/**
 * Extracts the Effect service requirements of an `EventHandler`.
 *
 * @remarks
 * ## Why
 *
 * Template inference uses this helper to preserve the handler's `R` channel.
 *
 * ## Ownership and lifetime
 *
 * This is a compile-time projection and acquires no services.
 *
 * @example
 * ```ts
 * import type { EventHandler, Services } from "@typed/template/EventHandler"
 *
 * type Requirements = Services<EventHandler<MouseEvent, never, Console>>
 * ```
 *
 * @since 1.0.0
 * @category Handler requirements
 */
export type Services<T> = T extends EventHandler<infer _Ev, infer _E, infer R> ? R : never;

/**
 * Extracts the typed error channel of an `EventHandler`.
 *
 * @remarks
 * ## Why
 *
 * Handler failures remain visible when a handler is embedded in a template.
 *
 * ## Ownership and lifetime
 *
 * This is a compile-time projection and has no runtime lifetime.
 *
 * @example
 * ```ts
 * import type { Error, EventHandler } from "@typed/template/EventHandler"
 *
 * type Failure = Error<EventHandler<MouseEvent, "save-failed">>
 * ```
 *
 * @since 1.0.0
 * @category Handler failures
 */
export type Error<T> = T extends EventHandler<infer _Ev, infer E, infer _R> ? E : never;

/**
 * Extracts the native event type accepted by an `EventHandler`.
 *
 * @remarks
 * ## Why
 *
 * Integrations can recover the browser event type accepted by the handler.
 * EventSource invokes that handler with its forwarding `Proxy`, so the static
 * event type is preserved even though callback object identity is distinct.
 *
 * ## Ownership and lifetime
 *
 * This is a compile-time projection and owns no event object.
 *
 * @example
 * ```ts
 * import type { EventHandler, EventOf } from "@typed/template/EventHandler"
 *
 * type Click = EventOf<EventHandler<MouseEvent>>
 * ```
 *
 * @since 1.0.0
 * @category Native event types
 */
export type EventOf<T> = T extends EventHandler<infer Ev, infer _E, infer _R> ? Ev : never;

/**
 * Options for applying native event behavior before an Effect handler runs.
 *
 * @remarks
 * ## Why
 *
 * These flags make common DOM propagation choices composable while retaining
 * `AddEventListenerOptions` for browser listener behavior.
 *
 * ## Ownership and lifetime
 *
 * The immutable record owns no listener. The renderer reads it when attaching
 * the handler and the mount Scope owns the resulting registration.
 *
 * @example
 * ```ts
 * import type { EventOptions } from "@typed/template/EventHandler"
 *
 * const options: EventOptions = { preventDefault: true }
 * ```
 *
 * @since 1.0.0
 * @category Native listener policy
 */
export type EventOptions = {
  readonly preventDefault?: boolean;
  readonly stopPropagation?: boolean;
  readonly stopImmediatePropagation?: boolean;
};

/**
 * Creates a new `EventHandler`.
 *
 * @remarks
 * ## Why
 *
 * `EventHandler.make` connects an Event-shaped input to an Effect program.
 * Rendered handlers receive `EventSource`'s non-pooled Proxy: it forwards
 * properties and binds methods to the native event, but overrides
 * `currentTarget` with the delegated element and has distinct object identity.
 *
 * ## Ownership and lifetime
 *
 * `make` only describes the handler. A rendered template installs the listener
 * within its Effect Scope and removes it when that rendered part is finalized.
 * Any Effect returned by the callback keeps its error and required-service
 * channels in the `EventHandler<Ev, E, R>` type.
 *
 * ## Event options
 *
 * Native `AddEventListenerOptions` are passed through. Typed's convenience
 * flags call forwarded native methods before the handler; they do not introduce
 * a separate propagation or default-action system.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as EventHandler from "@typed/template/EventHandler"
 * import { html } from "@typed/template"
 *
 * // Simple handler
 * const clickHandler = EventHandler.make((event) => {
 *   console.log("Button clicked")
 * })
 *
 * // Handler with Effect
 * const submitHandler = EventHandler.make((event) =>
 *   Effect.gen(function* () {
 *     const form = event.target as HTMLFormElement
 *     const data = new FormData(form)
 *     yield* Effect.sync(() => console.log("Submitting:", data))
 *   })
 * )
 *
 * // Handler with options
 * const preventDefaultHandler = EventHandler.make(
 *   (event) => console.log("Prevented default"),
 *   { preventDefault: true }
 * )
 *
 * const template = html`<button onclick=${clickHandler}>Click</button>`
 * ```
 *
 * @param handler - The function to execute when the event occurs. Can return void or an Effect.
 * @param options - Optional configuration for the event listener.
 * @since 1.0.0
 * @category Event handler creation
 */
export function make<Ev extends Event, E = never, R = never>(
  handler: (event: Ev) => void | Effect.Effect<unknown, E, R>,
  options?: AddEventListenerOptions & EventOptions,
): EventHandler<Ev, E, R> {
  return {
    [EventHandlerTypeId]: EventHandlerTypeId,
    handler: (ev: Ev) => {
      if (options) handleEventOptions(options, ev);
      const result = handler(ev);
      if (Effect.isEffect(result)) return result;
      return Effect.void;
    },
    options,
    pipe(this: EventHandler<Ev, E, R>) {
      return pipeArguments(this, arguments);
    },
  };
}

/**
 * Provides services to the `EventHandler`.
 *
 * This allows you to inject dependencies into the effect returned by the event handler.
 *
 * @remarks
 * ## Why
 *
 * Providing a `Context` at the handler boundary narrows its required-service
 * channel while preserving the delegated event proxy and listener options.
 *
 * ## Ownership and lifetime
 *
 * The supplied services are captured by the returned description. Listener and
 * handler-fiber lifetime still belong to the renderer's Scope.
 *
 * @see https://effect.website/docs/requirements-management/services/
 *
 * @example
 * ```ts
 * import { Effect, Context } from "effect"
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * interface Database {
 *   readonly save: (data: string) => Effect.Effect<void>
 * }
 * const Database = Context.Service<Database>("Database")
 *
 * const handler = EventHandler.make((_event) => Effect.gen(function* () {
 *   const database = yield* Database
 *   yield* database.save("data")
 * }))
 *
 * // Provide services
 * const services = Context.make(Database, {
 *   save: (data) => Effect.sync(() => console.log(data))
 * })
 * const provided = EventHandler.provide(handler, services)
 * ```
 *
 * @since 1.0.0
 * @category Handler service provision
 */
export const provide: {
  <R2 = never>(
    services: Context.Context<R2>,
  ): <Ev extends Event, E = never, R = never>(
    handler: EventHandler<Ev, E, R>,
  ) => EventHandler<Ev, E, Exclude<R, R2>>;

  <Ev extends Event, E = never, R = never, R2 = never>(
    handler: EventHandler<Ev, E, R>,
    services: Context.Context<R2>,
  ): EventHandler<Ev, E, Exclude<R, R2>>;
} = dual(
  2,
  <Ev extends Event, E = never, R = never, R2 = never>(
    handler: EventHandler<Ev, E, R>,
    services: Context.Context<R2>,
  ): EventHandler<Ev, E, Exclude<R, R2>> => {
    return make((ev) => handler.handler(ev).pipe(Effect.provideContext(services)), handler.options);
  },
);

/**
 * Recovers from errors in the `EventHandler`.
 *
 * @remarks
 * ## Why
 *
 * Handling the full `Cause` preserves interruption and defect information
 * instead of reducing failures to thrown exceptions.
 *
 * ## Ownership and lifetime
 *
 * The returned description installs no listener. Recovery runs in the same
 * handler fiber and mount Scope when a real event arrives.
 *
 * @see https://effect.website/docs/error-management/expected-errors/
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * const handler = EventHandler.make((event) =>
 *   Effect.fail("Something went wrong")
 * )
 *
 * // Recover from errors
 * const recovered = EventHandler.catchCause(handler, (cause) =>
 *   Effect.sync(() => console.error("Error:", cause))
 * )
 * ```
 *
 * @since 1.0.0
 * @category Handler failure recovery
 */
export const catchCause: {
  <E, E2 = never, R2 = never>(
    f: (cause: Cause.Cause<E>) => Effect.Effect<unknown, E2, R2>,
  ): <Ev extends Event, R = never>(handler: EventHandler<Ev, E, R>) => EventHandler<Ev, E2, R | R2>;

  <Ev extends Event, E = never, R = never, E2 = never, R2 = never>(
    handler: EventHandler<Ev, E, R>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<unknown, E2, R2>,
  ): EventHandler<Ev, E2, R | R2>;
} = dual(
  2,
  <Ev extends Event, E = never, R = never, E2 = never, R2 = never>(
    handler: EventHandler<Ev, E, R>,
    f: (cause: Cause.Cause<E>) => Effect.Effect<unknown, E2, R2>,
  ): EventHandler<Ev, E2, R | R2> => {
    return make((ev) => handler.handler(ev).pipe(Effect.catchCause(f)), handler.options);
  },
);

/**
 * Helper to ensure a value is an `EventHandler`.
 *
 * If the input is already an `EventHandler`, it is returned as is.
 * If it is an `Effect`, it is wrapped in an `EventHandler` that ignores the event argument.
 *
 * @remarks
 * ## Why
 *
 * Template event parts accept either a reusable Effect or an event-aware
 * handler without erasing either value's error and service channels.
 *
 * ## Ownership and lifetime
 *
 * Conversion is inert. The renderer Scope owns the eventual listener and fiber.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { fromEffectOrEventHandler } from "@typed/template/EventHandler"
 *
 * const handler = fromEffectOrEventHandler(Effect.log("clicked"))
 * ```
 *
 * @since 1.0.0
 * @category Handler normalization
 */
export function fromEffectOrEventHandler<Ev extends Event, E = never, R = never>(
  handler: Effect.Effect<unknown, E, R> | EventHandler<Ev, E, R>,
): EventHandler<Ev, E, R> {
  if (isEventHandler(handler)) return handler;
  return make(() => handler as Effect.Effect<unknown, E, R>);
}

/**
 * Checks if a value is an `EventHandler`.
 *
 * @remarks
 * ## Why
 *
 * The nominal key distinguishes handler descriptions from arbitrary functions
 * before template compilation.
 *
 * ## Ownership and lifetime
 *
 * The guard only inspects the value and acquires nothing.
 *
 * @example
 * ```ts
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * const handler = EventHandler.make((event) => console.log("Click"))
 * const isHandler = EventHandler.isEventHandler(handler)
 * console.log(isHandler) // true
 *
 * const notHandler = (event: Event) => console.log("Click")
 * const isNotHandler = EventHandler.isEventHandler(notHandler)
 * console.log(isNotHandler) // false
 * ```
 *
 * @since 1.0.0
 * @category Event handler protocol
 */
export function isEventHandler<Ev extends Event, E = never, R = never>(
  handler: unknown,
): handler is EventHandler<Ev, E, R> {
  return hasProperty(handler, EventHandlerTypeId);
}

/**
 * Applies event options to a native DOM event.
 *
 * @remarks
 * ## Why
 *
 * Centralizing these calls guarantees that options invoke the supplied event's
 * methods before its Effect handler runs. For rendered handlers those methods
 * are bound through the `EventSource` Proxy to the underlying native event.
 *
 * ## Ownership and lifetime
 *
 * The function borrows the event for the call and retains nothing.
 *
 * @example
 * ```ts
 * import { handleEventOptions } from "@typed/template/EventHandler"
 *
 * handleEventOptions({ preventDefault: true }, new Event("submit", { cancelable: true }))
 * ```
 *
 * @since 1.0.0
 * @category Native event control
 */
export function handleEventOptions<Ev extends Event>(eventOptions: EventOptions, ev: Ev): boolean {
  if (eventOptions.preventDefault) ev.preventDefault();
  if (eventOptions.stopPropagation) ev.stopPropagation();
  if (eventOptions.stopImmediatePropagation) ev.stopImmediatePropagation();

  return true;
}

/**
 * Modifies an `EventHandler` to call `preventDefault()` on the event.
 *
 * @remarks
 * ## Why
 *
 * This records the policy on the handler while keeping the event native.
 *
 * ## Ownership and lifetime
 *
 * The returned description is inert; the renderer Scope owns its listener.
 *
 * @example
 * ```ts
 * import * as EventHandler from "@typed/template/EventHandler"
 * import { html } from "@typed/template"
 *
 * const handler = EventHandler.make((event) => {
 *   console.log("Form submit prevented")
 * })
 *
 * const preventDefaultHandler = EventHandler.preventDefault(handler)
 *
 * const template = html`<form onsubmit=${preventDefaultHandler}>...</form>`
 * ```
 *
 * @since 1.0.0
 * @category Default action control
 */
export function preventDefault<Ev extends Event, E = never, R = never>(
  handler: EventHandler<Ev, E, R>,
): EventHandler<Ev, E, R> {
  return make(handler.handler, { ...handler.options, preventDefault: true });
}

/**
 * Modifies an `EventHandler` to call `stopPropagation()` on the event.
 *
 * @remarks
 * ## Why
 *
 * This records native bubbling behavior on the inert handler description.
 * EventSource later applies it through the same forwarding event `Proxy` used
 * for every delegated handler.
 *
 * ## Ownership and lifetime
 *
 * The returned description is inert; the renderer Scope owns its listener.
 *
 * @example
 * ```ts
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * const handler = EventHandler.make((event) => {
 *   console.log("Event stopped")
 * })
 *
 * const stopPropHandler = EventHandler.stopPropagation(handler)
 * ```
 *
 * @since 1.0.0
 * @category Propagation control
 */
export function stopPropagation<Ev extends Event, E = never, R = never>(
  handler: EventHandler<Ev, E, R>,
): EventHandler<Ev, E, R> {
  return make(handler.handler, { ...handler.options, stopPropagation: true });
}

/**
 * Modifies an `EventHandler` to call `stopImmediatePropagation()` on the event.
 *
 * @remarks
 * ## Why
 *
 * This exposes the browser's immediate-propagation control directly.
 *
 * ## Ownership and lifetime
 *
 * The returned description is inert; the renderer Scope owns its listener.
 *
 * @example
 * ```ts
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * const handler = EventHandler.make((event) => {
 *   console.log("Immediate propagation stopped")
 * })
 *
 * const stopImmediateHandler = EventHandler.stopImmediatePropagation(handler)
 * ```
 *
 * @since 1.0.0
 * @category Propagation control
 */
export function stopImmediatePropagation<Ev extends Event, E = never, R = never>(
  handler: EventHandler<Ev, E, R>,
): EventHandler<Ev, E, R> {
  return make(handler.handler, { ...handler.options, stopImmediatePropagation: true });
}

/**
 * Modifies an `EventHandler` to run only once.
 *
 * @remarks
 * ## Why
 *
 * `once` uses listener metadata and delegated-source cleanup rather than local
 * component state.
 *
 * ## Ownership and lifetime
 *
 * The first matching event disposes the registration; closing the mount Scope
 * also removes it if it has not fired.
 *
 * @example
 * ```ts
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * const handler = EventHandler.make((event) => {
 *   console.log("This will only run once")
 * })
 *
 * const onceHandler = EventHandler.once(handler)
 * ```
 *
 * @since 1.0.0
 * @category Listener lifetime
 */
export function once<Ev extends Event, E = never, R = never>(
  handler: EventHandler<Ev, E, R>,
): EventHandler<Ev, E, R> {
  return make(handler.handler, { ...handler.options, once: true, passive: false });
}

/**
 * Modifies an `EventHandler` to be passive (improves scrolling performance).
 *
 * @remarks
 * ## Why
 *
 * The native passive-listener contract is available without a synthetic event
 * system. This combinator also clears incompatible `once` metadata.
 *
 * ## Ownership and lifetime
 *
 * The returned description is inert; the renderer Scope owns its listener.
 *
 * @example
 * ```ts
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * const handler = EventHandler.make((event) => {
 *   // Passive handlers can't call preventDefault
 *   console.log("Scroll event")
 * })
 *
 * const passiveHandler = EventHandler.passive(handler)
 * ```
 *
 * @since 1.0.0
 * @category Native listener policy
 */
export function passive<Ev extends Event, E = never, R = never>(
  handler: EventHandler<Ev, E, R>,
): EventHandler<Ev, E, R> {
  return make(handler.handler, { ...handler.options, passive: true, once: false });
}
