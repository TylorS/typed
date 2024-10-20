/**
 * @since 1.0.0
 */
import type { Document } from "@typed/dom/Document"
import { type DomServices, domServices, type DomServicesElementParams } from "@typed/dom/DomServices"
import { GlobalThis } from "@typed/dom/GlobalThis"
import { Window } from "@typed/dom/Window"
import type { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx/Fx"
import * as RefArray from "@typed/fx/RefArray"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Sink from "@typed/fx/Sink"
import { isComment, type Rendered } from "@typed/wire"
import * as Cause from "effect/Cause"
import type { DurationInput } from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Fiber from "effect/Fiber"
import * as Layer from "effect/Layer"
import type * as Scope from "effect/Scope"
import * as ElementRef from "./ElementRef.js"
import { ROOT_CSS_SELECTOR } from "./ElementSource.js"
import { renderToHtml, renderToHtmlString, serverLayer, staticLayer } from "./Html.js"
import { hydrate } from "./Hydrate.js"
import { adjustTime } from "./internal/utils.js"
import { render, renderLayer } from "./Render.js"
import type * as RenderContext from "./RenderContext.js"
import type { RenderEvent } from "./RenderEvent.js"
import * as RenderQueue from "./RenderQueue.js"
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
  readonly errors: RefSubject.Computed<ReadonlyArray<E>>
  readonly lastError: RefSubject.Filtered<E>
  readonly interrupt: Effect.Effect<void>
  readonly makeEvent: (type: string, eventInitDict?: EventInit) => Event
  readonly makeCustomEvent: <A>(type: string, eventInitDict?: CustomEventInit<A>) => CustomEvent<A>
  readonly dispatchEvent: (options: EventOptions) => Effect.Effect<void, Cause.NoSuchElementException>
  readonly click: (options?: Omit<EventOptions, "event">) => Effect.Effect<void, Cause.NoSuchElementException>
}

/**
 * @since 1.0.0
 */
export function testRender<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>,
  options?:
    & HappyDOMOptions
    & { readonly [K in keyof DomServicesElementParams]?: (document: Document) => DomServicesElementParams[K] }
    & { renderTimeout?: DurationInput }
): Effect.Effect<
  TestRender<E>,
  never,
  | Scope.Scope
  | Exclude<
    R,
    RenderTemplate | RenderContext.RenderContext | CurrentEnvironment | DomServices
  >
> {
  return Effect.gen(function*() {
    const window = yield* getOrMakeWindow(options)
    const elementRef = yield* ElementRef.make()
    const errors = yield* RefSubject.make<ReadonlyArray<E>>(Effect.succeed([]))
    const fiber = yield* fx.pipe(
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
      Effect.provide(Layer.mergeAll(renderLayer(window)))
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
    yield* adjustTime(1)
    yield* adjustTime(1)

    // Await the first render
    yield* Effect.race(
      Fx.first(elementRef),
      Effect.flatMap(
        Effect.sleep(options?.renderTimeout ?? 1000),
        (_) => Effect.dieMessage(`Rendering taking too long`)
      )
    )

    return test
  }).pipe(Effect.provide(RenderQueue.sync))
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
const NON_BUBBLING_EVENTS = new Set([
  "focus",
  "blur",
  "loadstart",
  "progress",
  "error",
  "load",
  "loadend"
])

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

export function getOrMakeWindow(
  options?: HappyDOMOptions
): Effect.Effect<Window & GlobalThis, never, Scope.Scope> {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return Effect.gen(function*() {
      window.document.head.innerHTML = ""
      window.document.body.innerHTML = ""
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          window.document.head.innerHTML = ""
          window.document.body.innerHTML = ""
        })
      )

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
  fx: Fx.Fx<RenderEvent, E, R>,
  f: (rendered: Rendered, window: Window & GlobalThis) => Elements,
  options?:
    & HappyDOMOptions
    & { readonly [K in keyof DomServicesElementParams]?: (document: Document) => DomServicesElementParams[K] }
): Effect.Effect<
  TestHydrate<E, Elements>,
  E,
  | Scope.Scope
  | Exclude<
    R,
    RenderContext.RenderContext | RenderQueue.RenderQueue | RenderTemplate | CurrentEnvironment | DomServices
  >
  | Exclude<R, RenderContext.RenderContext | RenderTemplate | CurrentEnvironment | DomServices>
> {
  return Effect.gen(function*() {
    const window = yield* getOrMakeWindow(options)
    const { body } = window.document

    const html = yield* Effect.provide(
      renderToHtmlString(fx),
      serverLayer.pipe(
        // Add DomServices to the layer for the types
        Layer.provideMerge(domServices()),
        Layer.provideMerge(Window.layer(window)),
        Layer.provideMerge(GlobalThis.layer(window))
      )
    )

    body.innerHTML = html

    const rendered = Array.from(body.childNodes)
    const elements = f(fromRendered(rendered), window)
    const elementRef = yield* ElementRef.make()
    const errors = yield* RefSubject.make<ReadonlyArray<E>>(Effect.succeed([]))
    const fiber = yield* fx.pipe(
      hydrate,
      (x) =>
        x.run(Sink.make(
          (cause) =>
            Effect.zipRight(
              Effect.logError(cause),
              Cause.failureOrCause(cause).pipe(
                Either.match({
                  onLeft: (error) => RefArray.append(errors, error),
                  onRight: (cause) => elementRef[ElementRef.ElementRefTypeId].onFailure(cause)
                })
              )
            ),
          (rendered) =>
            ElementRef.set(
              elementRef,
              fromRendered(rendered)
            )
        )),
      Effect.provide(renderLayer(window)),
      Effect.forkScoped
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
    yield* adjustTime(1)
    yield* adjustTime(1)

    // Await the first render
    yield* Effect.race(Fx.first(elementRef), Effect.delay(Effect.dieMessage(`Rendering taking too long`), 1000))

    return test
  })
}

function fromRendered(rendered: Rendered) {
  const elements = Array.isArray(rendered)
    ? rendered.filter((x) => isComment(x) ? !(x.data.startsWith("typed") || x.data.startsWith("/typed")) : true)
    : rendered

  return Array.isArray(elements) && elements.length === 1
    ? elements[0]
    : elements
}

const typedTemplateStartCommentRegex =
  /<!--typed-((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}={2}))-->/g
const typedTemplateEndCommentRegex =
  /<!--\/typed-((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}={2}))-->/g

export function isTemplateStartComment(comment: Comment) {
  return typedTemplateStartCommentRegex.test(`${comment.nodeValue}`)
}

export function isTemplateEndComment(comment: Comment) {
  return typedTemplateEndCommentRegex.test(`${comment.nodeValue}`)
}

export function stripTypedTemplateComments(html: string) {
  return html.replace(typedTemplateStartCommentRegex, "").replace(typedTemplateEndCommentRegex, "")
}

/**
 * @since 1.0.0
 */
export function testHtmlString<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>
): Effect.Effect<
  string,
  E,
  | Scope.Scope
  | Exclude<
    R,
    RenderContext.RenderContext | RenderQueue.RenderQueue | RenderTemplate | CurrentEnvironment
  >
> {
  return Effect.provide(renderToHtmlString(fx), staticLayer)
}

/**
 * @since 1.0.0
 */
export function testHtmlChunks<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>
): Effect.Effect<
  ReadonlyArray<string>,
  E,
  | Scope.Scope
  | Exclude<
    R,
    RenderContext.RenderContext | RenderQueue.RenderQueue | RenderTemplate | CurrentEnvironment
  >
> {
  return Fx.toReadonlyArray(Fx.provide(Fx.map(renderToHtml(fx), stripTypedTemplateComments), serverLayer))
}
