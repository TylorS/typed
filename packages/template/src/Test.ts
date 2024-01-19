/**
 * @since 1.0.0
 */
import type { Document } from "@typed/dom/Document"
import type { DomServices, DomServicesElementParams } from "@typed/dom/DomServices"
import type { GlobalThis } from "@typed/dom/GlobalThis"
import type { Window } from "@typed/dom/Window"
import type { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx/Fx"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Sink from "@typed/fx/Sink"
import { type Rendered } from "@typed/wire"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Fiber from "effect/Fiber"
import type * as Scope from "effect/Scope"
import * as ElementRef from "./ElementRef.js"
import { ROOT_CSS_SELECTOR } from "./ElementSource.js"
import { renderToHtmlString } from "./Html.js"
import { hydrate } from "./Hydrate.js"
import { adjustTime, isCommentWithValue } from "./internal/utils.js"
import { render } from "./Render.js"
import * as RenderContext from "./RenderContext.js"
import type { RenderEvent } from "./RenderEvent.js"
import type { RenderTemplate } from "./RenderTemplate.js"

// TODO: Instrument RenderTemplate to log info about when specific values are hanging for too long
// TODO: Input events
// TODO: Form events
// TODO: keyboard events
// TODO: drag and drop events

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export type HappyDOMOptions = ConstructorParameters<typeof import("happy-dom").Window>[0]

/**
 * @since 1.0.0
 */
export interface TestRender<E> {
  readonly window: Window & GlobalThis
  readonly document: Document
  readonly elementRef: ElementRef.ElementRef
  readonly errors: RefSubject.Computed<never, never, ReadonlyArray<E>>
  readonly lastError: RefSubject.Filtered<never, never, E>
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
    & HappyDOMOptions
    & { readonly [K in keyof DomServicesElementParams]?: (document: Document) => DomServicesElementParams[K] }
): Effect.Effect<
  Scope.Scope | Exclude<Exclude<R, RenderTemplate>, RenderContext.RenderContext | CurrentEnvironment | DomServices>,
  never,
  TestRender<E>
> {
  return Effect.gen(function*(_) {
    const window = yield* _(getOrMakeWindow(options))
    const elementRef = yield* _(ElementRef.make())
    const errors = yield* _(RefSubject.make<never, never, ReadonlyArray<E>>(Effect.succeed([])))
    const fiber = yield* _(
      fx,
      render,
      (x) =>
        x.run(Sink.make(
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
      Effect.provide(RenderContext.dom(window, { skipRenderScheduling: true }))
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

    // Await the first render
    yield* _(Fx.first(elementRef), Effect.race(Effect.delay(Effect.dieMessage(`Rendering taking too long`), 1000)))

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

function getOrMakeWindow(
  options?: HappyDOMOptions
): Effect.Effect<Scope.Scope, never, Window & GlobalThis> {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return Effect.gen(function*(_) {
      window.document.head.innerHTML = ""
      window.document.body.innerHTML = ""
      yield* _(Effect.addFinalizer(() =>
        Effect.sync(() => {
          window.document.head.innerHTML = ""
          window.document.body.innerHTML = ""
        })
      ))

      return window
    })
  }

  return Effect.promise(() =>
    import("happy-dom").then((happyDOM) => new happyDOM.Window(options) as any as Window & GlobalThis)
  )
}

/**
 * @since 1.0.0
 */
export interface TestHydrate<E, Elements> extends TestRender<E> {
  readonly elements: Elements
}

/**
 * @since 1.0.0
 */
export function testHydrate<R, E, Elements>(
  fx: Fx.Fx<R, E, RenderEvent>,
  f: (rendered: Rendered, window: Window & GlobalThis) => Elements,
  options?:
    & HappyDOMOptions
    & { readonly [K in keyof DomServicesElementParams]?: (document: Document) => DomServicesElementParams[K] }
) {
  return Effect.gen(function*(_) {
    const window = yield* _(getOrMakeWindow(options))
    const { body } = window.document

    const html = yield* _(
      renderToHtmlString(fx),
      Effect.provide(RenderContext.server)
    )

    body.innerHTML = html

    const rendered = Array.from(body.childNodes)

    // Remove the typed-start
    if (isCommentWithValue(rendered[0], "typed-start")) {
      rendered.shift()
    }
    // Remove the typed-end
    if (isCommentWithValue(rendered[rendered.length - 1], "typed-end")) {
      rendered.pop()
    }

    const elements = f(rendered.length === 1 ? rendered[0] : rendered, window)

    const elementRef = yield* _(ElementRef.make())
    const errors = yield* _(RefSubject.make<never, never, ReadonlyArray<E>>(Effect.succeed([])))
    const fiber = yield* _(
      fx,
      hydrate,
      (x) =>
        x.run(Sink.make(
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
      Effect.provide(RenderContext.dom(window, { skipRenderScheduling: true }))
    )

    const test: TestHydrate<E, Elements> = {
      elements,
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

    // Await the first render
    yield* _(Fx.first(elementRef), Effect.race(Effect.delay(Effect.dieMessage(`Rendering taking too long`), 1000)))

    return test
  })
}
