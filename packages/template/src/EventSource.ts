import * as Effect from "effect/Effect";
import type * as Fiber from "effect/Fiber";
import * as Scope from "effect/Scope";
import type { EventHandler } from "./EventHandler.js";
import { getElements, type Rendered } from "./Wire.js";

type EventName = string;

type Handler<Ev extends Event> = EventHandler<Ev>;

/**
 * An interface for managing event listeners on DOM nodes.
 *
 * It abstracts the process of adding and removing event listeners, ensuring that they are
 * properly cleaned up when the scope is closed or the element is removed.
 *
 * @remarks
 * ## Why
 *
 * `EventSource` delegates browser events across the concrete nodes represented
 * by a rendered value. A matching callback receives a non-pooled `Proxy` that
 * forwards properties, binds methods to the native event, and overrides
 * `currentTarget` with the registered delegated target. Handlers may be
 * registered before or after a mount.
 *
 * ## Ownership and lifetime
 *
 * `setup` binds one rendered range to an explicit Effect `Scope`. That Scope
 * removes native listeners and interrupts every handler fiber it started.
 * Cancellation is signaled without awaiting handlers, which may themselves
 * be publishing the update that removes this mount.
 * Disposing the value returned by `addEventListener` removes only that entry.
 * No document-global registry or parallel propagation model is created, but the
 * callback event is not object-identical to the browser event because of that
 * `currentTarget` Proxy.
 *
 * @see https://effect.website/docs/resource-management/scope/
 *
 * @example
 * ```ts
 * import { Effect, Scope } from "effect"
 * import { makeEventSource } from "@typed/template/EventSource"
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * const program = Effect.scoped(Effect.gen(function* () {
 *   const eventSource = makeEventSource()
 *   const button = document.createElement("button")
 *
 *   // Add event listener
 *   const handler = EventHandler.make((event: MouseEvent) => {
 *     console.log("Button clicked")
 *   })
 *
 *   const disposable = eventSource.addEventListener(button, "click", handler)
 *
 *   // Setup listeners for rendered content
 *   yield* eventSource.setup(button, yield* Scope.Scope)
 *
 *   // Cleanup
 *   disposable[Symbol.dispose]()
 * }))
 * ```
 *
 * @since 1.0.0
 * @category Delegated event sources
 */
export interface EventSource {
  /**
   * Registers a delegated native event handler for one concrete target.
   *
   * @remarks
   * ## Why
   *
   * Registration can happen before a rendered range is attached, keeping
   * template compilation separate from mounting.
   *
   * ## Ownership and lifetime
   *
   * The returned Disposable removes this entry from every active mount; each
   * mount Scope independently owns its native attachments.
   *
   * @since 1.0.0
   * @category Delegated registrations
   */
  readonly addEventListener: <Ev extends Event>(
    element: EventTarget,
    event: EventName,
    handler: Handler<Ev>,
  ) => Disposable;

  /**
   * Sets up event listeners for a rendered template within a scope.
   *
   * @remarks
   * ## Why
   *
   * Delegation attaches to the concrete elements represented by DOM output. The
   * proxy preserves the browser event's `target`, properties, and bound methods
   * while reporting the registered element as `currentTarget`.
   *
   * ## Ownership and lifetime
   *
   * The supplied Scope removes listeners and interrupts handler fibers.
   *
   * @since 1.0.0
   * @category Delegated mount lifetime
   */
  readonly setup: (rendered: Rendered, scope: Scope.Scope) => Effect.Effect<void>;
}

type Entry = {
  readonly element: Element;
  readonly event: EventName;
  readonly handler: Handler<any>;
  readonly attachments: Set<Disposable>;
};

type Mount = {
  readonly elements: ReadonlyArray<Element>;
  readonly run: Run;
  readonly attachments: Map<Entry, Disposable>;
};
type Run = <E, A>(effect: Effect.Effect<A, E>) => Fiber.Fiber<A, E>;

const disposable = (f: () => void): Disposable => ({ [Symbol.dispose]: f });
const dispose = (d: Disposable): void => d[Symbol.dispose]();

/**
 * Creates a new `EventSource`.
 *
 * The created `EventSource` can efficiently manage multiple event listeners,
 * grouping them by event type and handling setup/teardown lifecycles.
 *
 * @remarks
 * ## Why
 *
 * The source is a small renderer-local registry that supports delegated
 * listeners without requiring a component runtime.
 *
 * ## Ownership and lifetime
 *
 * Construction allocates only the in-memory registry. Each `setup` call ties
 * attached native listeners and forked handler Effects to the supplied Scope;
 * returned per-handler disposables remain independently usable.
 *
 * @example
 * ```ts
 * import { Effect, Scope } from "effect"
 * import { makeEventSource } from "@typed/template/EventSource"
 * import * as EventHandler from "@typed/template/EventHandler"
 *
 * const program = Effect.scoped(Effect.gen(function* () {
 *   const eventSource = makeEventSource()
 *   const element = document.createElement("div")
 *
 *   // Add multiple event listeners
 *   eventSource.addEventListener(element, "click", EventHandler.make(() => console.log("clicked")))
 *   eventSource.addEventListener(element, "mouseover", EventHandler.make(() => console.log("hovered")))
 *
 *   // Setup all listeners
 *   yield* eventSource.setup(element, yield* Scope.Scope)
 * }))
 * ```
 *
 * @since 1.0.0
 * @category Delegated event sources
 */
export function makeEventSource(): EventSource {
  const listeners = new Map<EventName, Set<Entry>>();
  const mounts = new Set<Mount>();

  function removeEntry(entry: Entry) {
    const entries = listeners.get(entry.event);
    entries?.delete(entry);
    if (entries?.size === 0) listeners.delete(entry.event);
    for (const attachment of entry.attachments) dispose(attachment);
    entry.attachments.clear();
    for (const mount of mounts) mount.attachments.delete(entry);
  }

  function attachEntry(entry: Entry, mount: Mount): void {
    const disposables: Array<Disposable> = [];
    const { element: target, event, handler: eventHandler } = entry;

    for (const element of mount.elements) {
      const listener = (ev: Event) => {
        if (!listeners.get(event)?.has(entry)) return;
        const match = ev.target === target || target.contains(ev.target as Node);
        if (!match) return;
        if (eventHandler.options?.once === true) removeEntry(entry);
        mount.run(eventHandler.handler(proxyCurrentTarget(ev, target)));
      };
      const options = eventHandler.options;
      element.addEventListener(event, listener, {
        capture: options?.capture,
        passive: options?.passive,
        signal: options?.signal,
      });
      disposables.push(
        disposable(() => element.removeEventListener(event, listener, options?.capture)),
      );
    }

    const attachment = disposable(() => disposables.forEach(dispose));
    entry.attachments.add(attachment);
    mount.attachments.set(entry, attachment);
  }

  function addEventListener(
    element: EventTarget,
    event: EventName,
    handler: Handler<any>,
  ): Disposable {
    const entries = listeners.get(event) ?? new Set<Entry>();
    const entry: Entry = {
      element: element as Element,
      event,
      handler,
      attachments: new Set(),
    };
    if (!listeners.has(event)) listeners.set(event, entries);
    entries.add(entry);
    for (const mount of mounts) attachEntry(entry, mount);
    return disposable(() => removeEntry(entry));
  }

  function setup(rendered: Rendered, scope: Scope.Scope) {
    const elements = getElements(rendered);
    if (elements.length === 0) return Effect.void;

    const fibers = new Set<Fiber.Fiber<any, any>>();
    const run: Run = <E, A>(effect: Effect.Effect<A, E>) => {
      return Effect.runFork(effect, {
        onFiberStart: (fiber) => {
          fibers.add(fiber);
          fiber.addObserver(() => fibers.delete(fiber));
        },
      });
    };

    const mount: Mount = { elements, run, attachments: new Map() };
    mounts.add(mount);
    for (const entries of listeners.values()) {
      for (const entry of entries) attachEntry(entry, mount);
    }

    return Scope.addFinalizer(
      scope,
      Effect.sync(() => {
        mounts.delete(mount);
        for (const attachment of mount.attachments.values()) {
          dispose(attachment);
        }
        mount.attachments.clear();
        // A handler can publish the update that closes this mount. Waiting for
        // its interruption here would make that publication wait for itself.
        for (const fiber of fibers) fiber.interruptUnsafe();
        fibers.clear();
      }),
    );
  }

  return {
    addEventListener,
    setup,
  };
}

function proxyCurrentTarget<E extends Event>(event: E, currentTarget: Element): E {
  return new Proxy(event, {
    get(target: E, property: string | symbol) {
      if (property === "currentTarget") return currentTarget;
      const value = target[property as keyof E];
      if (typeof value === "function") return value.bind(event);
      return value;
    },
  });
}
