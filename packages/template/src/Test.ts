/**
 * @since 1.0.0
 */
import type { Document } from "@typed/dom/Document"
import type { DomServices, DomServicesElementParams } from "@typed/dom/DomServices"
import type { GlobalThis } from "@typed/dom/GlobalThis"
import type { Window } from "@typed/dom/Window"
import type { CurrentEnvironment } from "@typed/environment"
import type { Computed } from "@typed/fx/Computed"
import type { Filtered } from "@typed/fx/Filtered"
import * as Fx from "@typed/fx/Fx"
import * as RefArray from "@typed/fx/RefArray"
import * as Sink from "@typed/fx/Sink"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Fiber from "effect/Fiber"
import type * as Scope from "effect/Scope"
import * as happyDOM from "happy-dom"
import type IHappyDOMOptions from "happy-dom/lib/window/IHappyDOMOptions.js"
import * as ElementRef from "./ElementRef"
import { ROOT_CSS_SELECTOR } from "./ElementSource"
import { adjustTime } from "./internal/utils"
import { render } from "./Render"
import * as RenderContext from "./RenderContext"
import type { RenderEvent } from "./RenderEvent"
import type { RenderTemplate } from "./RenderTemplate"

// TODO: Instrument RenderTemplate to log info about when specific values are hanging for too long
// TODO: Input events
// TODO: Form events
// TODO: keyboard events
// TODO: drag and drop events

/**
 * @since 1.0.0
 */
export interface TestRender<E> {
  readonly window: Window & GlobalThis & Pick<happyDOM.Window, "happyDOM">
  readonly document: Document
  readonly elementRef: ElementRef.ElementRef
  readonly errors: Computed<never, never, ReadonlyArray<E>>
  readonly lastError: Filtered<never, never, E>
  readonly interrupt: Effect.Effect<never, never, void>
  readonly makeEvent: (type: string, eventInitDict?: EventInit) => Event
  readonly makeCustomEvent: <A>(type: string, eventInitDict?: CustomEventInit<A>) => CustomEvent<A>
  readonly dispatchEvent: (options: EventOptions) => Effect.Effect<never, Cause.NoSuchElementException, void>
  readonly click: (options?: Omit<EventOptions, "event">) => Effect.Effect<never, Cause.NoSuchElementException, void>
}

/**
 * @since 1.0.0
 */
export function testRender<R, E>(
  fx: Fx.Fx<R, E, RenderEvent>,
  options?:
    & IHappyDOMOptions
    & { readonly [K in keyof DomServicesElementParams]?: (document: Document) => DomServicesElementParams[K] }
): Effect.Effect<
  Scope.Scope | Exclude<Exclude<R, RenderTemplate>, RenderContext.RenderContext | CurrentEnvironment | DomServices>,
  never,
  TestRender<E>
> {
  return Effect.gen(function*(_) {
    const window = makeWindow(options)
    const elementRef = yield* _(ElementRef.make())
    const errors = yield* _(RefArray.make<never, never, E>(Effect.succeed([])))
    const fiber = yield* _(
      fx,
      render,
      Fx.run(Sink.Sink(
        (cause) =>
          Cause.failureOrCause(cause).pipe(
            Either.match({
              onLeft: (error) => RefArray.append(errors, error),
              onRight: (cause) => errors.onFailure(cause)
            })
          ),
        (rendered) => ElementRef.set(elementRef, rendered)
      )),
      Effect.forkScoped,
      Effect.provide(RenderContext.browser(window, { skipRenderScheduling: true }))
    )

    const test: TestRender<E> = {
      window,
      document: window.document,
      elementRef,
      errors,
      lastError: RefArray.last(errors),
      interrupt: Fiber.interrupt(fiber),
      makeEvent: (type, init) => new window.Event(type, init),
      makeCustomEvent: (type, init) => new window.CustomEvent(type, init),
      dispatchEvent: (options) => dispatchEvent(test, options),
      click: (options) => click(test, options)
    }

    // Allow our fibers to start
    yield* _(adjustTime(1))
    yield* _(adjustTime(1))

    return test
  })
}

/**
 * @since 1.0.0
 */
export type EventOptions = {
  readonly event: string
  readonly selector?: string
  readonly eventInit?: EventInit
}

// TODO: Find more events to add here
const NON_BUBBLING_EVENTS = new Set(["focus", "blur"])

/**
 * @since 1.0.0
 */
export function dispatchEvent<E>(
  { elementRef, makeEvent }: Pick<TestRender<E>, "elementRef" | "makeEvent">,
  options: EventOptions
) {
  const selector = options.selector ?? ROOT_CSS_SELECTOR

  return elementRef.query(selector).dispatchEvent(
    makeEvent(options.event, {
      bubbles: !NON_BUBBLING_EVENTS.has(selector),
      cancelable: true,
      composed: false,
      ...options?.eventInit
    })
  )
}

/**
 * @since 1.0.0
 */
export function click<E>(
  rendered: Pick<TestRender<E>, "elementRef" | "makeEvent">,
  options?: Omit<EventOptions, "event">
) {
  return dispatchEvent(rendered, { event: "click", ...options, eventInit: { bubbles: true, ...options?.eventInit } })
}

// internals

function makeWindow(options?: IHappyDOMOptions) {
  return new happyDOM.Window(options) as any as Window & GlobalThis & Pick<happyDOM.Window, "happyDOM">
}
