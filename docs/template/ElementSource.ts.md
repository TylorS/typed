---
title: ElementSource.ts
nav_order: 3
parent: "@typed/template"
---

## ElementSource overview

Added in v1.0.0

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
  - [fromElement](#fromelement)
  - [getElements](#getelements)

---

# utils

## CssSelectors

**Signature**

```ts
export declare function CssSelectors(selectors: ReadonlyArray<string>): CssSelectors
```

Added in v1.0.0

## CssSelectors (interface)

**Signature**

```ts
export interface CssSelectors {
  readonly _tag: "css"
  readonly selectors: ReadonlyArray<string>
}
```

Added in v1.0.0

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

Added in v1.0.0

## ElementSelector

**Signature**

```ts
export declare function ElementSelector(element: Element): ElementSelector
```

Added in v1.0.0

## ElementSelector (interface)

**Signature**

```ts
export interface ElementSelector {
  readonly _tag: "element"
  readonly element: Element
}
```

Added in v1.0.0

## ElementSource

**Signature**

```ts
export declare function ElementSource<T extends Rendered, EventMap extends {} = DefaultEventMap<T>>(
  rootElement: RefSubject.Filtered<never, never, T>
): ElementSource<T, EventMap>
```

Added in v1.0.0

## ElementSource (interface)

**Signature**

```ts
export interface ElementSource<
  T extends Rendered = Element,
  EventMap extends {} = DefaultEventMap<Rendered.Elements<T>[number]>
> extends Versioned.Versioned<
    never,
    never,
    Scope.Scope,
    never,
    Rendered.Elements<T>,
    never,
    NoSuchElementException,
    Rendered.Elements<T>
  > {
  readonly selector: Selector

  readonly query: {
    <S extends string, Ev extends {} = DefaultEventMap<ParseSelector<S, Element>>>(
      selector: S
    ): ElementSource<ParseSelector<S, Element>, Ev>

    <Target extends Rendered, EventMap extends {} = DefaultEventMap<Target>>(
      rendered: Target
    ): ElementSource<Target, EventMap>
  }

  readonly elements: RefSubject.Filtered<never, never, Rendered.Elements<T>>

  readonly events: <Type extends keyof EventMap>(
    type: Type,
    options?: AddEventListenerOptions
  ) => Fx.Fx<Scope.Scope, never, EventWithCurrentTarget<Rendered.Elements<T>[number], EventMap[Type]>>

  readonly dispatchEvent: (event: Event, wait?: DurationInput) => Effect.Effect<never, NoSuchElementException, void>
}
```

Added in v1.0.0

## ParseSelector (type alias)

**Signature**

```ts
export type ParseSelector<T extends string, Fallback> = [T] extends [typeof ROOT_CSS_SELECTOR]
  ? Fallback
  : Fallback extends globalThis.Element
    ? TQS.ParseSelector<T, Fallback>
    : Fallback
```

Added in v1.0.0

## ROOT_CSS_SELECTOR

**Signature**

```ts
export declare const ROOT_CSS_SELECTOR: ":root"
```

Added in v1.0.0

## Selector (type alias)

**Signature**

```ts
export type Selector = CssSelectors | ElementSelector
```

Added in v1.0.0

## fromElement

**Signature**

```ts
export declare function fromElement<T extends Element, EventMap extends {} = DefaultEventMap<T>>(
  rootElement: T
): ElementSource<T, EventMap>
```

Added in v1.0.0

## getElements

**Signature**

```ts
export declare function getElements<T extends Rendered>(element: T): ReadonlyArray<Element>
```

Added in v1.0.0
