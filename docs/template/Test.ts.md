---
title: Test.ts
nav_order: 22
parent: "@typed/template"
---

## Test overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [utils](#utils)
  - [EventOptions (type alias)](#eventoptions-type-alias)
  - [HappyDOMOptions (type alias)](#happydomoptions-type-alias)
  - [TestHydrate (interface)](#testhydrate-interface)
  - [TestRender (interface)](#testrender-interface)
  - [click](#click)
  - [dispatchEvent](#dispatchevent)
  - [testHydrate](#testhydrate)
  - [testRender](#testrender)

---

# utils

## EventOptions (type alias)

**Signature**

```ts
export type EventOptions = {
  readonly event: string
  readonly selector?: string
  readonly eventInit?: EventInit
}
```

Added in v1.0.0

## HappyDOMOptions (type alias)

**Signature**

```ts
export type HappyDOMOptions = ConstructorParameters<typeof import("happy-dom").Window>[0]
```

## TestHydrate (interface)

**Signature**

```ts
export interface TestHydrate<E, Elements> extends TestRender<E> {
  readonly elements: Elements
}
```

Added in v1.0.0

## TestRender (interface)

**Signature**

```ts
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
```

Added in v1.0.0

## click

**Signature**

```ts
export declare function click<E>(
  rendered: Pick<TestRender<E>, "elementRef" | "makeEvent">,
  options?: Omit<EventOptions, "event">
)
```

Added in v1.0.0

## dispatchEvent

**Signature**

```ts
export declare function dispatchEvent<E>(
  { elementRef, makeEvent }: Pick<TestRender<E>, "elementRef" | "makeEvent">,
  options: EventOptions
)
```

Added in v1.0.0

## testHydrate

**Signature**

```ts
export declare function testHydrate<R, E, Elements>(
  fx: Fx.Fx<RenderEvent, E, R>,
  f: (rendered: Rendered, window: Window & GlobalThis) => Elements,
  options?: HappyDOMOptions & {
    readonly [K in keyof DomServicesElementParams]?: (document: Document) => DomServicesElementParams[K]
  }
): Effect.Effect<
  TestHydrate<E, Elements>,
  E,
  Scope.Scope | Exclude<R, RenderTemplate | RenderContext.RenderContext | CurrentEnvironment | DomServices>
>
```

Added in v1.0.0

## testRender

**Signature**

```ts
export declare function testRender<E, R>(
  fx: Fx.Fx<RenderEvent, E, R>,
  options?: HappyDOMOptions & {
    readonly [K in keyof DomServicesElementParams]?: (document: Document) => DomServicesElementParams[K]
  } & { renderTimeout?: DurationInput }
): Effect.Effect<
  TestRender<E>,
  never,
  Scope.Scope | Exclude<R, RenderTemplate | RenderContext.RenderContext | CurrentEnvironment | DomServices>
>
```

Added in v1.0.0
