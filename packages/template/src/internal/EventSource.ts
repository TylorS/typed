import type { Rendered } from "@typed/wire"
import { Effect, Scope } from "effect"
import type * as Fiber from "effect/Fiber"
import * as Runtime from "effect/Runtime"
import { getElements } from "../ElementSource"
import type { EventHandler } from "../EventHandler"

type EventName = string

type Handler<Ev extends Event> = EventHandler<never, never, Ev>

export interface EventSource {
  readonly addEventListener: <Ev extends Event>(
    element: Element,
    event: EventName,
    handler: Handler<Ev>
  ) => void

  readonly setup: (rendered: Rendered, scope: Scope.Scope) => Effect.Effect<never, never, void>
}

type Entry = readonly [Element, Handler<any>]
type Run = <E, A>(effect: Effect.Effect<never, E, A>) => Fiber.RuntimeFiber<E, A>

const disposable = (f: () => void): Disposable => ({
  [Symbol.dispose]: f
})

export function makeEventSource(): EventSource {
  const bubbleListeners = new Map<
    EventName,
    Set<Entry>
  >()
  const captureListeners = new Map<
    EventName,
    Set<Entry>
  >()

  function addListener(
    listeners: Map<
      EventName,
      Set<Entry>
    >,
    event: EventName,
    entry: Entry
  ): void {
    const set = listeners.get(event)
    if (set === undefined) {
      const set = new Set<Entry>()
      set.add(entry)
      listeners.set(event, set)
    } else {
      set.add(entry)
    }
  }

  function addEventListener<Ev extends Event>(
    element: Element,
    event: EventName,
    handler: Handler<Ev>
  ): void {
    if (handler.options?.capture === true) {
      return addListener(captureListeners, event, [element, handler])
    } else {
      return addListener(bubbleListeners, event, [element, handler])
    }
  }

  function setupBubbleListeners(element: Element, run: Run) {
    const disposables: Array<Disposable> = []

    for (const [event, handlers] of bubbleListeners) {
      const listener = (ev: Event) =>
        run(
          Effect.forEach(handlers, ([el, handler]) =>
            ev.target === el || el.contains(ev.target as Node) ? handler.handler(ev) : Effect.unit)
        )
      element.addEventListener(event, listener, getDerivedAddEventListenerOptions(handlers))
      disposables.push(disposable(() => element.removeEventListener(event, listener)))
    }

    return disposables
  }

  function setupCaptureListeners(element: Element, run: Run) {
    const disposables: Array<Disposable> = []

    for (const [event, handlers] of captureListeners) {
      const listener = (ev: Event) =>
        run(
          Effect.forEach(handlers, ([el, handler]) =>
            ev.target === el || el.contains(ev.target as Node)
              ? handler.handler(proxyCurrentTargetForCaptureEvents(ev, el))
              : Effect.unit)
        )
      element.addEventListener(event, listener, getDerivedAddEventListenerOptions(handlers))
      disposables.push(disposable(() => element.removeEventListener(event, listener)))
    }

    return disposables
  }

  function setup(rendered: Rendered, scope: Scope.Scope) {
    const hasBubbleListeners = bubbleListeners.size > 0
    const hasCaptureListeners = captureListeners.size > 0

    if (!hasBubbleListeners && !hasCaptureListeners) {
      return Effect.unit
    }

    return Effect.flatMap(Effect.runtime<never>(), (runtime) => {
      const elements = getElements(rendered)
      const disposables: Array<Disposable> = []
      const runFork = Runtime.runFork(runtime)
      const run: Run = <E, A>(effect: Effect.Effect<never, E, A>) =>
        runFork(Effect.fromFiberEffect(Effect.forkIn(effect, scope)))

      for (const element of elements) {
        if (hasBubbleListeners) {
          disposables.push(...setupBubbleListeners(element, run))
        }
        if (hasCaptureListeners) {
          disposables.push(...setupCaptureListeners(element, run))
        }
      }

      return Scope.addFinalizer(scope, Effect.sync(() => disposables.forEach((d) => d[Symbol.dispose]())))
    })
  }

  return {
    addEventListener,
    setup
  }
}

const EVENT_PROPERTY_TO_REPLACE = "currentTarget"

function proxyCurrentTargetForCaptureEvents<E extends Event>(event: E, currentTarget: Element): E {
  return new Proxy(event, {
    get(target: E, property: string | symbol) {
      return property === EVENT_PROPERTY_TO_REPLACE ? currentTarget : target[property as keyof E]
    }
  })
}

function getDerivedAddEventListenerOptions(entries: Set<Entry>): AddEventListenerOptions {
  const hs = Array.from(entries)
  return {
    once: hs.some((h) => h[1].options?.once === true),
    passive: hs.every((h) => h[1].options?.passive === true)
  }
}
