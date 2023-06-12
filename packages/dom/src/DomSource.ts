/* eslint-disable @typescript-eslint/ban-types */
import { pipe } from '@effect/data/Function'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'
import type { Wire } from '@typed/wire'

import { addEventListener } from './EventTarget.js'
import { type ParseSelector, type DefaultEventMap, ROOT_CSS_SELECTOR } from './helpers.js'

export interface DomSource<T = HTMLElement, EventMap extends {} = DefaultEventMap<T>> {
  readonly selectors: ReadonlyArray<string>

  readonly query: <S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, T>>>(
    selector: S,
  ) => DomSource<ParseSelector<S, T>, Ev>

  readonly elements: Fx.Fx<never, never, ReadonlyArray<T>>

  readonly events: <T extends keyof EventMap>(
    type: T,
    options?: AddEventListenerOptions,
  ) => Fx.Fx<never, never, EventMap[T] & { readonly currentTarget: T }>
}

type Rendered = Node | DocumentFragment | Wire | readonly Rendered[]

export const DomSource = Object.assign(Context.Tag<DomSource>('@typed/dom/DomSource'), {
  make: function DomSource<
    T extends Rendered = HTMLElement,
    EventMap extends {} = DefaultEventMap<T>,
  >(
    rootElement: Fx.Fx<never, never, T>,
    selectors: ReadonlyArray<string> = [],
  ): DomSource<T, EventMap> {
    const eventMap = new Map<any, Fx.Fx<never, never, any>>()

    const manager: DomSource<T, EventMap> = {
      selectors,
      query: <S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, T>>>(
        selector: S,
      ): DomSource<ParseSelector<S, T>, Ev> => {
        if (selector === ROOT_CSS_SELECTOR)
          return manager as unknown as DomSource<ParseSelector<S, T>, Ev>

        return DomSource(
          Fx.multicast(pipe(rootElement, Fx.map(findMostSpecificElement(selectors)))),
          [...selectors, selector],
        ) as DomSource<ParseSelector<S, T>, Ev>
      },
      elements:
        selectors.length === 0
          ? pipe(rootElement, Fx.map(getElements), Fx.multicast)
          : pipe(
              rootElement,
              Fx.map(findMatchingElements<any>(selectors)),
              Fx.filter((e) => e.length > 0),
              Fx.multicast,
            ),
      events: (type, options) => {
        if (eventMap.has(type)) return eventMap.get(type) as Fx.Fx<never, never, any>

        const s = pipe(
          rootElement,
          Fx.switchMap(makeEventStream(selectors, type as any, options)),
          Fx.multicast,
        )

        eventMap.set(type, s)

        return s
      },
    }

    return manager
  },
})

export function query<
  Element,
  S extends string,
  Ev extends {} = DefaultEventMap<ParseSelector<S, Element>>,
>(selector: S) {
  return <EventMap extends {}>(source: DomSource<Element, EventMap>) =>
    source.query<S, Ev>(selector)
}

export function elements<Element, Ev extends {}>(source: DomSource<Element, Ev>) {
  return source.elements
}

export function events<
  Element,
  EventMap extends Readonly<Record<T, any>>,
  T extends keyof EventMap,
>(type: T, options?: AddEventListenerOptions) {
  return (source: DomSource<Element, EventMap>) => source.events<T>(type, options)
}

function findMostSpecificElement<T extends Element>(cssSelectors: ReadonlyArray<string>) {
  return function (element: Rendered): T {
    const elements = getElements(element)

    for (let i = 0; i < cssSelectors.length; ++i) {
      const cssSelector = dropLast(i, cssSelectors).join(' ')

      for (let j = 0; j < elements.length; ++j) {
        const node = elements[j].querySelector(cssSelector)

        if (node) return node as T
      }
    }

    return element as T
  }
}

function findMatchingElements<El extends Element = Element>(cssSelectors: ReadonlyArray<string>) {
  const cssSelector = cssSelectors.join(' ')
  return function (element: Rendered): ReadonlyArray<El> {
    const elements = getElements(element)
    const nodes = elements.flatMap((element) =>
      Array.from(element.querySelectorAll<El>(cssSelector)),
    )

    const matchedElements = elements.filter((element) => element.matches(cssSelector)) as El[]

    if (matchedElements.length > 0) return [...matchedElements, ...nodes]

    return nodes
  }
}

function dropLast(i: number, cssSelectors: readonly string[]) {
  return cssSelectors.slice(0, cssSelectors.length - i)
}

function makeEventStream<Ev extends Event>(
  cssSelectors: ReadonlyArray<string>,
  eventType: string,
  options: EventListenerOptions = {},
) {
  return function (element: Rendered): Fx.Fx<never, never, Ev> {
    const { capture } = options
    const cssSelector = cssSelectors.join(' ')
    const lastTwoCssSelectors = cssSelectors.slice(-2).join('')
    const elements = getElements(element)

    const event$ = Fx.mergeAll(
      ...elements.map((element) =>
        pipe(
          element,
          addEventListener(eventType as any, options),
          Fx.filter(
            (event: Ev) =>
              ensureMatches(cssSelector, element, event, capture) ||
              ensureMatches(lastTwoCssSelectors, element, event, capture),
          ),
        ),
      ),
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

  return function <E extends Event>(event: E): E {
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

const EVENT_PROPERTY_TO_REPLACE = 'currentTarget'

function cloneEvent<E extends Event>(event: E, currentTarget: Element): E {
  return new Proxy(event, {
    get(target: E, property: string | symbol) {
      return property === EVENT_PROPERTY_TO_REPLACE ? currentTarget : target[property as keyof E]
    },
  })
}

function ensureMatches(cssSelector: string, element: Element, ev: Event, capture = false): boolean {
  let target = ev.target as Element

  if (!cssSelector) return (capture && element.contains(target)) || target === element

  for (; target && target !== element; target = target.parentElement as Element)
    if (target.matches(cssSelector)) return true

  return element.matches(cssSelector)
}

function getElements<T extends Rendered>(element: T): ReadonlyArray<Element> {
  if (Array.isArray(element)) return element.flatMap(getElements)
  if (isWire(element as RenderedWithoutArray))
    return getElements(element.valueOf() as DocumentFragment)
  if (isElement(element as RenderedWithoutArray)) return [element as Element]
  if (isDocumentFragment(element as RenderedWithoutArray))
    return Array.from((element as Element).children)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if ((element as Node).parentElement) return [(element as Node).parentElement!]

  return []
}

type RenderedWithoutArray = Exclude<Rendered, readonly Rendered[]>

function isDocumentFragment(element: RenderedWithoutArray): element is DocumentFragment {
  return element.nodeType === element.DOCUMENT_FRAGMENT_NODE
}

function isElement(element: RenderedWithoutArray): element is Element {
  return element.nodeType === element.ELEMENT_NODE
}

function isWire(element: RenderedWithoutArray): element is Wire {
  return element.nodeType === 111
}
