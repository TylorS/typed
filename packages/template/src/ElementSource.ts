import type { EventWithCurrentTarget } from "@typed/dom/EventTarget"
import { addEventListener } from "@typed/dom/EventTarget"
import type { Filtered } from "@typed/fx/Filtered"
import * as Fx from "@typed/fx/Fx"
import type { Rendered } from "@typed/wire"
import { isWire } from "@typed/wire"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import * as Scope from "effect/Scope"

import type * as TQS from "typed-query-selector/parser"

export interface ElementSource<T extends Rendered = Element, EventMap extends {} = DefaultEventMap<T>> {
  readonly selectors: ReadonlyArray<string>

  readonly query: <S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, Element>>>(
    selector: S
  ) => ElementSource<ParseSelector<S, Element>, Ev>

  readonly elements: Filtered<never, never, Rendered.Values<T>>

  readonly events: <Type extends keyof EventMap>(
    type: Type,
    options?: AddEventListenerOptions
  ) => Fx.Fx<never, never, EventWithCurrentTarget<T, EventMap[Type]>>
}

export function ElementSource<T extends Rendered, EventMap extends {} = DefaultEventMap<T>>(
  rootElement: Filtered<never, never, T>
): ElementSource<T, EventMap> {
  return new ElementSourceImpl<T, EventMap>(rootElement)
}

export type ParseSelector<T extends string, Fallback> = [T] extends [typeof ROOT_CSS_SELECTOR] ? Fallback
  : Fallback extends globalThis.Element ? TQS.ParseSelector<T, Fallback>
  : Fallback

export type DefaultEventMap<T> = T extends Window ? WindowEventMap
  : T extends Document ? DocumentEventMap
  : T extends HTMLVideoElement ? HTMLVideoElementEventMap
  : T extends HTMLMediaElement ? HTMLMediaElementEventMap
  : T extends HTMLElement ? HTMLElementEventMap
  : T extends SVGElement ? SVGElementEventMap
  : T extends Element ? ElementEventMap & Readonly<Record<string, Event>>
  : Readonly<Record<string, Event>>

export const ROOT_CSS_SELECTOR = `:root` as const

type RenderedWithoutArray = Exclude<Rendered, ReadonlyArray<Rendered>>

function getElements<T extends Rendered>(element: T): ReadonlyArray<Element> {
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
  return function(element: Rendered): Fx.Fx<never, never, Ev> {
    const { capture } = options
    const cssSelector = cssSelectors.join(" ")
    const lastTwoCssSelectors = cssSelectors.slice(-2).join("")
    const elements = getElements(element)

    const event$ = Fx.merge(
      elements.map((element) =>
        Fx.filter(
          Fx.withScopedFork<never, never, Ev>(({ scope, sink }) =>
            Effect.zipRight(
              Effect.provideService(
                addEventListener(element, {
                  eventName,
                  handler: (ev) => sink.onSuccess(ev as any as Ev)
                }),
                Scope.Scope,
                scope
              ),
              Effect.never
            )
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
 */
export class ElementSourceImpl<T extends Rendered, EventMap extends {} = DefaultEventMap<T>>
  implements ElementSource<T, EventMap>
{
  private eventMap = new Map<any, Fx.Fx<never, never, any>>()

  constructor(readonly rootElement: Filtered<never, never, T>, readonly selectors: ReadonlyArray<string> = []) {
    this.query = this.query.bind(this)
    this.events = this.events.bind(this)
  }

  query<S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, Element>>>(
    selector: S
  ): ElementSource<ParseSelector<S, Element>, Ev> {
    if (selector === ROOT_CSS_SELECTOR) {
      return this as any
    }

    return new ElementSourceImpl(this.rootElement, [...this.selectors, selector]) as any
  }

  readonly elements: ElementSource<T, EventMap>["elements"] = this.selectors.length === 0
    ? this.rootElement.map(getElements) as any
    : this.rootElement.map(findMatchingElements<any>(this.selectors))

  events<Type extends keyof EventMap>(
    type: Type,
    options?: AddEventListenerOptions
  ) {
    if (this.eventMap.has(type)) return this.eventMap.get(type)!

    const s = this.rootElement.map(findMostSpecificElement(this.selectors)).pipe(
      Fx.switchMap(makeEventStream(this.selectors, type as any, options)),
      Fx.multicast
    )

    this.eventMap.set(type, s)

    return s
  }
}
