---
title: ElementSource.ts
nav_order: 3
parent: "@typed/template"
---

## ElementSource overview

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [CssSelectors](#cssselectors)
  - [CssSelectors (interface)](#cssselectors-interface)
  - [DefaultEventMap (type alias)](#defaulteventmap-type-alias)
  - [ElementSelector](#elementselector)
  - [ElementSelector (interface)](#elementselector-interface)
  - [ElementSource](#elementsource)
  - [ElementSource (interface)](#elementsource-interface)
  - [ParseSelector (type alias)](#parseselector-type-alias)
  - [ROOT_CSS_SELECTOR](#root_css_selector)
  - [Selector (type alias)](#selector-type-alias)

---

# utils

## CssSelectors

**Signature**

```ts
export declare function CssSelectors(selectors: ReadonlyArray<string>): CssSelectors
```

## CssSelectors (interface)

**Signature**

```ts
export interface CssSelectors {
  readonly _tag: 'css'
  readonly selectors: ReadonlyArray<string>
}
```

## DefaultEventMap (type alias)

**Signature**

```ts
export type DefaultEventMap<T> = T extends Window
  ? WindowEventMap
  : T extends Document
  ? DocumentEventMap
  : T extends HTMLVideoElement
  ? HTMLVideoElementEventMap
  : T extends HTMLMediaElement
  ? HTMLMediaElementEventMap
  : T extends HTMLElement
  ? HTMLElementEventMap
  : T extends SVGElement
  ? SVGElementEventMap
  : T extends Element
  ? ElementEventMap & Readonly<Record<string, Event>>
  : Readonly<Record<string, Event>>
```

## ElementSelector

**Signature**

```ts
export declare function ElementSelector(element: Element): ElementSelector
```

## ElementSelector (interface)

**Signature**

```ts
export interface ElementSelector {
  readonly _tag: 'element'
  readonly element: Element
}
```

## ElementSource

**Signature**

```ts
export declare function ElementSource<T extends Rendered, EventMap extends {} = DefaultEventMap<T>>(
  rootElement: Filtered<never, never, T>
): ElementSource<T, EventMap>
```

## ElementSource (interface)

**Signature**

```ts
export interface ElementSource<T extends Rendered = Element, E = never, EventMap extends {} = DefaultEventMap<T>>
  extends Versioned.Versioned<
    never,
    never,
    E,
    Rendered.Elements<T>,
    never,
    E | NoSuchElementException,
    Rendered.Elements<T>
  > {
  readonly selector: Selector

  readonly query: {
    <S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, Element>>>(selector: S): ElementSource<
      ParseSelector<S, Element>,
      E,
      Ev
    >

    <Target extends Rendered, EventMap extends {} = DefaultEventMap<Target>>(rendered: Target): ElementSource<
      Target,
      E,
      EventMap
    >
  }

  readonly elements: Filtered<never, E, Rendered.Elements<T>>

  readonly events: <Type extends keyof EventMap>(
    type: Type,
    options?: AddEventListenerOptions
  ) => Fx.Fx<never, E, EventWithCurrentTarget<T, EventMap[Type]>>
}
```

## ParseSelector (type alias)

**Signature**

```ts
export type ParseSelector<T extends string, Fallback> = [T] extends [typeof ROOT_CSS_SELECTOR]
  ? Fallback
  : Fallback extends globalThis.Element
  ? TQS.ParseSelector<T, Fallback>
  : Fallback
```

## ROOT_CSS_SELECTOR

**Signature**

```ts
export declare const ROOT_CSS_SELECTOR: ':root'
```

## Selector (type alias)

**Signature**

```ts
export type Selector = CssSelectors | ElementSelector
```
