/* eslint-disable @typescript-eslint/ban-types */
import { pipe } from '@fp-ts/data/Function'
import * as Context from '@typed/context'
import * as Fx from '@typed/fx'

import { addEventListener } from './EventTarget.js'
import { ParseSelector, DefaultEventMap, ROOT_CSS_SELECTOR } from './helpers.js'

export interface DomSource<Element = HTMLElement, EventMap extends {} = DefaultEventMap<Element>> {
  readonly selectors: ReadonlyArray<string>

  readonly query: <S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, Element>>>(
    selector: S,
  ) => DomSource<ParseSelector<S, Element>, Ev>

  readonly elements: Fx.Fx<never, never, ReadonlyArray<Element>>

  readonly events: <T extends keyof EventMap>(
    type: T,
    options?: AddEventListenerOptions,
  ) => Fx.Fx<never, never, EventMap[T] & { readonly currentTarget: Element }>
}

export const DomSource = Object.assign(function DomSource<
  Element extends globalThis.Element = HTMLElement,
  EventMap extends {} = DefaultEventMap<Element>,
>(
  rootElement: Fx.Fx<never, never, Element>,
  selectors: ReadonlyArray<string> = [],
): DomSource<Element, EventMap> {
  const eventMap = new Map<any, Fx.Fx<never, never, any>>()

  const manager: DomSource<Element, EventMap> = {
    selectors,
    query: <S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, Element>>>(
      selector: S,
    ): DomSource<ParseSelector<S, Element>, Ev> => {
      if (selector === ROOT_CSS_SELECTOR) return manager as any

      return DomSource(
        Fx.multicast(pipe(rootElement, Fx.map(findMostSpecificElement(selectors)))),
        [...selectors, selector],
      )
    },
    elements:
      selectors.length === 0
        ? pipe(
            rootElement,
            Fx.map((e) => [e]),
            Fx.multicast,
          )
        : pipe(
            rootElement,
            Fx.map(findMatchingElements(selectors)),
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
Context.Tag<DomSource>('@typed/dom/DomSource'))

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
  return function (element: Element): T {
    for (let i = 0; i < cssSelectors.length; ++i) {
      const cssSelector = dropLast(i, cssSelectors).join(' ')
      const node = element.querySelector(cssSelector)

      if (node) return node as T
    }

    return element as T
  }
}

function findMatchingElements<El extends Element = Element>(cssSelectors: ReadonlyArray<string>) {
  const cssSelector = cssSelectors.join(' ')
  return function (element: El): ReadonlyArray<El> {
    const nodes = Array.from(element.querySelectorAll(cssSelector))

    if (element.matches(cssSelector)) return [element, ...nodes] as any as ReadonlyArray<El>

    return nodes as any as ReadonlyArray<El>
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
  return function (element: Element): Fx.Fx<never, never, Ev> {
    const { capture } = options
    const cssSelector = cssSelectors.join(' ')
    const lastTwoCssSelectors = cssSelectors.slice(-2).join('')

    const event$ = pipe(
      element,
      addEventListener(eventType as any, options),
      Fx.filter(
        (event: Ev) =>
          ensureMatches(cssSelector, element, event, capture) ||
          ensureMatches(lastTwoCssSelectors, element, event, capture),
      ),
    )

    if (capture) {
      return pipe(event$, Fx.map(findCurrentTarget(cssSelector, element)))
    }

    return event$
  }
}

function findCurrentTarget(cssSelector: string, element: Element) {
  return function <E extends Event>(event: E): E {
    const isCurrentTarget = !cssSelector || element.matches(cssSelector)

    if (isCurrentTarget) return cloneEvent(event, element) as E

    const nodes = element.querySelectorAll(cssSelector)

    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i]
      const containsEventTarget = node.contains(event.target as Element)

      if (containsEventTarget) return cloneEvent(event, node) as E
    }

    return event
  }
}

const EVENT_PROPERTY_TO_REPLACE = 'currentTarget'

function cloneEvent(event: Event, currentTarget: Element): Event {
  return new Proxy(event, {
    get(target: Event, property: keyof Event) {
      return property === EVENT_PROPERTY_TO_REPLACE ? currentTarget : target[property]
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
