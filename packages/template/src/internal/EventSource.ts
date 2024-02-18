import type { Rendered } from "@typed/wire"
import { Effect, Scope } from "effect"
import * as Fiber from "effect/Fiber"
import * as Runtime from "effect/Runtime"
import { getElements } from "../ElementSource.js"
import type { EventHandler } from "../EventHandler.js"

type EventName = string

type Handler<Ev extends Event> = EventHandler<Ev>

export interface EventSource {
  readonly addEventListener: <Ev extends Event>(
    element: Element,
    event: EventName,
    handler: Handler<Ev>
  ) => void

  readonly setup: (rendered: Rendered, scope: Scope.Scope) => Effect.Effect<void>
}

type Entry = readonly [Element, Handler<any>]
type Run = <E, A>(effect: Effect.Effect<A, E>) => Fiber.RuntimeFiber<A, E>

const disposable = (f: () => void): Disposable => ({
  [Symbol.dispose]: f
})

const dispose = (d: Disposable): void => d[Symbol.dispose]()

export function makeEventSource(): EventSource {
  const bubbleListeners = new Map<
    EventName,
    readonly [normal: Set<Entry>, once: Set<Entry>]
  >()
  const captureListeners = new Map<
    EventName,
    readonly [normal: Set<Entry>, once: Set<Entry>]
  >()

  function addListener(
    listeners: Map<
      EventName,
      readonly [normal: Set<Entry>, once: Set<Entry>]
    >,
    event: EventName,
    entry: Entry
  ): void {
    const sets = listeners.get(event)
    const isOnce = entry[1].options?.once === true
    if (sets === undefined) {
      const normal = new Set<Entry>()
      const once = new Set<Entry>()
      if (isOnce) {
        once.add(entry)
      } else {
        normal.add(entry)
      }
      listeners.set(event, [normal, once])
    } else {
      const [normal, once] = sets
      if (isOnce) {
        once.add(entry)
      } else {
        normal.add(entry)
      }
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

    for (const [event, sets] of bubbleListeners) {
      for (const handlers of sets) {
        const listener = (ev: Event) =>
          run(
            Effect.forEach(handlers, ([el, handler]) =>
              ev.target === el || el.contains(ev.target as Node) ? handler.handler(ev) : Effect.unit)
          )
        element.addEventListener(event, listener, getDerivedAddEventListenerOptions(handlers))
        disposables.push(disposable(() => element.removeEventListener(event, listener)))
      }
    }

    return disposables
  }

  function setupCaptureListeners(element: Element, run: Run) {
    const disposables: Array<Disposable> = []

    for (const [event, sets] of captureListeners) {
      for (const handlers of sets) {
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
    }

    return disposables
  }

  function setup(rendered: Rendered, scope: Scope.Scope) {
    const hasBubbleListeners = bubbleListeners.size > 0
    const hasCaptureListeners = captureListeners.size > 0
    const elements = getElements(rendered)

    if (elements.length === 0 || (!hasBubbleListeners && !hasCaptureListeners)) {
      return Effect.unit
    }

    return Effect.flatMap(Effect.runtime<never>(), (runtime) => {
      const disposables: Array<Disposable> = []
      const fibers = new Map<symbol, Fiber.RuntimeFiber<any, any>>()
      const runFork = Runtime.runFork(runtime)
      const run: Run = <E, A>(effect: Effect.Effect<A, E>) => {
        const id = Symbol()
        const fiber = runFork(Effect.onExit(effect, () => Effect.sync(() => fibers.delete(id))))
        fibers.set(id, fiber)
        return fiber
      }

      for (const element of elements) {
        if (hasBubbleListeners) {
          disposables.push(...setupBubbleListeners(element, run))
        }
        if (hasCaptureListeners) {
          disposables.push(...setupCaptureListeners(element, run))
        }
      }

      return Scope.addFinalizer(
        scope,
        Effect.suspend(() => {
          disposables.forEach(dispose)
          if (fibers.size === 0) return Effect.unit
          return Fiber.interruptAll(fibers.values())
        })
      )
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
    once: hs.every((h) => h[1].options?.once === true),
    passive: hs.every((h) => h[1].options?.passive === true)
  }
}
