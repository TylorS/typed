/**
 * @since 1.0.0
 */

import type { EventWithCurrentTarget } from "@typed/dom/EventTarget"
import { addEventListener } from "@typed/dom/EventTarget"
import * as Fx from "@typed/fx/Fx"
import { FxEffectBase } from "@typed/fx/Fx"
import * as Versioned from "@typed/fx/Versioned"
import type { Rendered } from "@typed/wire"
import { isWire } from "@typed/wire"
import type { NoSuchElementException } from "effect/Cause"
import type { DurationInput } from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type * as Scope from "effect/Scope"
import { adjustTime } from "./internal/utils.js"

import * as RefSubject from "@typed/fx/RefSubject"
import type * as TQS from "typed-query-selector/parser"

/**
 * @since 1.0.0
 */
export interface ElementSource<
  T extends Rendered = Element,
  EventMap extends {} = DefaultEventMap<Rendered.Elements<T>[number]>
> extends
  Versioned.Versioned<
    never,
    never,
    Rendered.Elements<T>,
    never,
    Scope.Scope,
    Rendered.Elements<T>,
    NoSuchElementException,
    never
  >
{
  readonly selector: Selector

  readonly query: {
    <S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, Element>>>(
      selector: S
    ): ElementSource<ParseSelector<S, Element>, Ev>

    <Target extends Rendered, EventMap extends {} = DefaultEventMap<Target>>(
      rendered: Target
    ): ElementSource<Target, EventMap>
  }

  readonly elements: RefSubject.Filtered<Rendered.Elements<T>>

  readonly events: <Type extends keyof EventMap>(
    type: Type,
    options?: AddEventListenerOptions
  ) => Fx.Fx<EventWithCurrentTarget<Rendered.Elements<T>[number], EventMap[Type]>, never, Scope.Scope>

  readonly dispatchEvent: (event: Event, wait?: DurationInput) => Effect.Effect<void, NoSuchElementException>
}

/**
 * @since 1.0.0
 */
export function ElementSource<T extends Rendered, EventMap extends {} = DefaultEventMap<T>>(
  rootElement: RefSubject.Filtered<T>
): ElementSource<T, EventMap> {
  return new ElementSourceImpl<T, EventMap>(rootElement) as any
}

/**
 * @since 1.0.0
 */
export function fromElement<T extends Element, EventMap extends {} = DefaultEventMap<T>>(
  rootElement: T
): ElementSource<T, EventMap> {
  return ElementSourceImpl.fromElement(rootElement) as any
}

/**
 * @since 1.0.0
 */
export type ParseSelector<T extends string, Fallback> = [T] extends [typeof ROOT_CSS_SELECTOR] ? Fallback
  : Fallback extends globalThis.Element ? TQS.ParseSelector<T, Fallback>
  : Fallback

/**
 * @since 1.0.0
 */
export type DefaultEventMap<T> = T extends Window ? WindowEventMap
  : T extends Document ? DocumentEventMap
  : T extends HTMLVideoElement ? HTMLVideoElementEventMap
  : T extends HTMLMediaElement ? HTMLMediaElementEventMap
  : T extends HTMLElement ? HTMLElementEventMap
  : T extends SVGElement ? SVGElementEventMap
  : T extends Element ? ElementEventMap & Readonly<Record<string, Event>>
  : Readonly<Record<string, Event>>

/**
 * @since 1.0.0
 */
export const ROOT_CSS_SELECTOR = `:root` as const

type RenderedWithoutArray = Exclude<Rendered, ReadonlyArray<Rendered>>

/**
 * @since 1.0.0
 */
export function getElements<T extends Rendered>(element: T): ReadonlyArray<Element> {
  if (Array.isArray(element)) return element.flatMap(getElements)
  if (isWire(element as RenderedWithoutArray)) {
    return Array.from((element.valueOf() as DocumentFragment).children)
  }
  if (isElement(element as RenderedWithoutArray)) return [element as Element]
  if (isDocumentFragment(element as RenderedWithoutArray)) {
    return Array.from((element as DocumentFragment).children)
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if ((element as Node).parentElement) return [(element as Node).parentElement!]

  return []
}

function findMostSpecificElement<T extends Element>(cssSelectors: ReadonlyArray<string>) {
  return function(element: Rendered): T {
    const elements = getElements(element)

    for (let i = 0; i < cssSelectors.length; ++i) {
      const cssSelector = dropLast(i, cssSelectors).join(" ")

      for (let j = 0; j < elements.length; ++j) {
        const node = elements[j].querySelector(cssSelector)

        if (node) return node as T
      }
    }

    return element as T
  }
}

function findMatchingElements<El extends Element = Element>(cssSelectors: ReadonlyArray<string>) {
  if (cssSelectors.length === 0) return getElements

  const cssSelector = cssSelectors.join(" ")
  return function(element: Rendered): ReadonlyArray<El> {
    const elements = getElements(element)
    const nodes = elements.flatMap((element) => Array.from(element.querySelectorAll<El>(cssSelector)))

    const matchedElements = elements.filter((element) => element.matches(cssSelector)) as Array<El>

    if (matchedElements.length > 0) return [...matchedElements, ...nodes]

    return nodes
  }
}

function dropLast(i: number, cssSelectors: ReadonlyArray<string>) {
  return cssSelectors.slice(0, cssSelectors.length - i)
}

function makeEventStream<Ev extends Event>(
  cssSelectors: ReadonlyArray<string>,
  eventName: string,
  options: EventListenerOptions = {}
) {
  return function(element: Rendered): Fx.Fx<Ev> {
    const { capture } = options
    const cssSelector = cssSelectors.join(" ")
    const lastTwoCssSelectors = cssSelectors.slice(-2).join("")
    const elements = getElements(element)

    const event$ = Fx.mergeAll(
      elements.map((element) =>
        Fx.filter(
          Fx.make<Ev>((sink) =>
            Effect.scoped(Effect.zipRight(
              addEventListener(element, {
                eventName,
                handler: (ev) => sink.onSuccess(ev as any as Ev)
              }),
              Effect.never
            ))
          ),
          (event: Ev) =>
            ensureMatches(cssSelector, element, event, capture) ||
            ensureMatches(lastTwoCssSelectors, element, event, capture)
        )
      )
    )

    if (capture) {
      return pipe(event$, Fx.map(findCurrentTarget(cssSelector, element)))
    }

    return event$
  }
}

function makeElementEventStream<Ev extends Event>(
  currentTarget: Element,
  eventName: string,
  options: EventListenerOptions = {}
) {
  return function(rendered: Rendered): Fx.Fx<Ev> {
    const { capture } = options
    const elements = getElements(rendered)

    const event$ = Fx.mergeAll(
      elements.map((element) =>
        Fx.filter(
          Fx.make<Ev>((sink) =>
            Effect.scoped(Effect.zipRight(
              addEventListener(element, {
                eventName,
                handler: (ev) => sink.onSuccess(ev as any as Ev)
              }),
              Effect.never
            ))
          ),
          (event: Ev) => event.target ? currentTarget.contains(event.target as Element) : false
        )
      )
    )

    if (capture) {
      return event$.pipe(Fx.map((ev) => cloneEvent(ev, currentTarget)))
    }

    return event$
  }
}

function findCurrentTarget(cssSelector: string, element: Rendered) {
  const elements = getElements(element)
  const length = elements.length

  return function<E extends Event>(event: E): E {
    for (let i = 0; i < length; ++i) {
      const element = elements[i]
      const isCurrentTarget = !cssSelector || element.matches(cssSelector)

      if (isCurrentTarget) return cloneEvent(event, element) as E

      const nodes = element.querySelectorAll(cssSelector)

      for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i]
        const containsEventTarget = node.contains(event.target as Element)

        if (containsEventTarget) return cloneEvent(event, node)
      }
    }

    return event
  }
}

const EVENT_PROPERTY_TO_REPLACE = "currentTarget"

function cloneEvent<E extends Event>(event: E, currentTarget: Element): E {
  return new Proxy(event, {
    get(target: E, property: string | symbol) {
      return property === EVENT_PROPERTY_TO_REPLACE ? currentTarget : target[property as keyof E]
    }
  })
}

function ensureMatches(cssSelector: string, element: Element, ev: Event, capture = false): boolean {
  let target = ev.target as Element

  if (!cssSelector) return (capture && element.contains(target)) || target === element

  for (; target && target !== element; target = target.parentElement as Element) {
    if (target.matches(cssSelector)) return true
  }

  return element.matches(cssSelector)
}

function isDocumentFragment(element: RenderedWithoutArray): element is DocumentFragment {
  return element.nodeType === element.DOCUMENT_FRAGMENT_NODE
}

function isElement(element: RenderedWithoutArray): element is Element {
  return element.nodeType === element.ELEMENT_NODE
}

/**
 * @internal
 * @since 1.0.0
 */
// @ts-expect-error Doesn't implement Placeholder
export class ElementSourceImpl<
  T extends Rendered,
  EventMap extends {} = DefaultEventMap<Rendered.Elements<T>[number]>
> extends FxEffectBase<Rendered.Elements<T>, never, Scope.Scope, Rendered.Elements<T>, NoSuchElementException, never>
  implements ElementSource<T, EventMap>
{
  private bubbleMap = new Map<any, Fx.Fx<any, never, Scope.Scope>>()
  private captureMap = new Map<any, Fx.Fx<any, never, Scope.Scope>>()

  readonly elements: ElementSource<T, EventMap>["elements"]
  readonly version: ElementSource<T, EventMap>["version"]

  constructor(
    readonly rootElement: RefSubject.Filtered<T>,
    readonly selector: Selector = CssSelectors([])
  ) {
    super()
    this.query = this.query.bind(this)
    this.events = this.events.bind(this)

    this.elements = this.selector._tag === "css" ?
      RefSubject.map(this.rootElement, findMatchingElements<any>(this.selector.selectors)) :
      RefSubject.filterMapEffect(
        Versioned.of(this.selector.element),
        (x) => Effect.succeedSome([x] as any as Rendered.Elements<T>)
      ) as any

    this.version = this.elements.version
  }

  static fromElement<T extends Rendered>(rootElement: T): ElementSource<T> {
    return new ElementSourceImpl<T>(RefSubject.filterMapEffect(Versioned.of(rootElement), Effect.succeedSome)) as any
  }

  toEffect(): Effect.Effect<Rendered.Elements<T>, NoSuchElementException> {
    return this.elements
  }

  toFx(): Fx.Fx<Rendered.Elements<T>, never, Scope.Scope> {
    return this.elements
  }

  query<S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, Element>>>(
    selector: S
  ): ElementSource<ParseSelector<S, Element>, Ev> {
    if (selector === ROOT_CSS_SELECTOR) {
      return this as any
    } else if (typeof selector === "string") {
      if (this.selector._tag === "css") {
        return new ElementSourceImpl(this.rootElement, CssSelectors([...this.selector.selectors, selector])) as any
      } else {
        return ElementSourceImpl.fromElement(this.selector.element).query(selector) as any
      }
    } else {
      return new ElementSourceImpl(this.rootElement, ElementSelector(selector)) as any
    }
  }

  events<Type extends keyof EventMap>(
    type: Type,
    options?: AddEventListenerOptions
  ): Fx.Fx<EventWithCurrentTarget<Rendered.Elements<T>[number], EventMap[Type]>, never, Scope.Scope> {
    const capture = options?.capture === true
    const map = capture ? this.captureMap : this.bubbleMap

    let current = map.get(type)

    if (current === undefined) {
      if (this.selector._tag === "css") {
        current = RefSubject.map(this.rootElement, findMostSpecificElement(this.selector.selectors)).pipe(
          Fx.switchMap(makeEventStream(this.selector.selectors, type as any, options)),
          Fx.multicast
        )
      } else {
        current = this.rootElement.pipe(
          Fx.switchMap(makeElementEventStream(this.selector.element, type as string, options)),
          Fx.multicast
        )
      }

      map.set(type, current!)
    }

    return current
  }

  dispatchEvent(event: Event, wait?: DurationInput) {
    return Effect.zipRight(
      Effect.flatMap(
        this.elements,
        (elements) => Effect.sync(() => elements.length > 0 ? elements[0].dispatchEvent(event) : null)
      ),
      // Allow time to move forward
      adjustTime(wait)
    )
  }
}

/**
 * @since 1.0.0
 */
export type Selector = CssSelectors | ElementSelector

/**
 * @since 1.0.0
 */
export interface CssSelectors {
  readonly _tag: "css"
  readonly selectors: ReadonlyArray<string>
}

/**
 * @since 1.0.0
 */
export function CssSelectors(selectors: ReadonlyArray<string>): CssSelectors {
  return {
    _tag: "css",
    selectors
  }
}

/**
 * @since 1.0.0
 */
export interface ElementSelector {
  readonly _tag: "element"
  readonly element: Element
}

/**
 * @since 1.0.0
 */
export function ElementSelector(element: Element): ElementSelector {
  return {
    _tag: "element",
    element
  }
}
