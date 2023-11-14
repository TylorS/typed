import type { Document } from "@typed/dom/Document"
import { domServices } from "@typed/dom/DomServices"
import type { DomServices, DomServicesElementParams } from "@typed/dom/DomServices"
import { GlobalThis } from "@typed/dom/GlobalThis"
import { Window } from "@typed/dom/Window"
import type { CurrentEnvironment } from "@typed/environment"
import type { Computed } from "@typed/fx/Computed"
import type { Filtered } from "@typed/fx/Filtered"
import * as Fx from "@typed/fx/Fx"
import * as RefArray from "@typed/fx/RefArray"
import * as Sink from "@typed/fx/Sink"
import * as ElementRef from "@typed/template/ElementRef"
import { ROOT_CSS_SELECTOR } from "@typed/template/ElementSource"
import { adjustTime } from "@typed/template/internal/utils"
import { render } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import * as Layer from "effect/Layer"
import type * as Scope from "effect/Scope"
import * as happyDOM from "happy-dom"
import type IHappyDOMOptions from "happy-dom/lib/window/IHappyDOMOptions"

// TODO: Instrument RenderTemplate to log info about when specific values are hanging for too long
// TODO: Fx.mergeRace
// TODO: Input events
// TODO: Form events
// TODO: keyboard events
// TODO: drag and drop events

export interface TestRender<E> {
  readonly window: Window & GlobalThis & Pick<happyDOM.Window, "happyDOM">
  readonly elementRef: ElementRef.ElementRef
  readonly errors: Computed<never, never, ReadonlyArray<E>>
  readonly lastError: Filtered<never, never, E>
  readonly interrupt: Effect.Effect<never, never, void>
  readonly makeEvent: (type: string, eventInitDict?: EventInit) => Event
  readonly makeCustomEvent: <A>(type: string, eventInitDict?: CustomEventInit<A>) => CustomEvent<A>
  readonly dispatchEvent: (options: EventOptions) => Effect.Effect<never, Cause.NoSuchElementException, void>
  readonly click: (options: Omit<EventOptions, "event">) => Effect.Effect<never, Cause.NoSuchElementException, void>
}

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
    const layer = Layer.useMerge(
      Layer.mergeAll(
        RenderContext.browser,
        domServices({
          rootElement: options?.rootElement?.(window.document),
          parentElement: options?.parentElement?.(window.document)
        })
      ),
      Layer.mergeAll(GlobalThis.layer(window), Window.layer(window))
    )

    const fiber = yield* _(
      fx,
      render,
      Fx.run(Sink.Sink(
        (cause) => RefArray.appendAll(errors, Cause.failures(cause)),
        (rendered) => ElementRef.set(elementRef, rendered)
      )),
      Effect.forkScoped,
      Effect.provide(layer)
    )

    const test: TestRender<E> = {
      window,
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

    return test
  })
}

export type EventOptions = {
  readonly event: string
  readonly selector?: string
  readonly eventInit?: EventInit
}

export function dispatchEvent<E>(rendered: Pick<TestRender<E>, "elementRef" | "makeEvent">, options: EventOptions) {
  return rendered.elementRef.query(options?.selector ?? ROOT_CSS_SELECTOR).dispatchEvent(
    rendered.makeEvent(options.event, {
      bubbles: true,
      cancelable: true,
      composed: false,
      ...options?.eventInit
    })
  )
}

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
