/**
 * @since 1.0.0
 */
import type { Fx } from "@typed/fx/Fx"
import { compact, FxEffectBase } from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Versioned } from "@typed/fx/Versioned"
import { type Rendered } from "@typed/wire"
import type { NoSuchElementException } from "effect/Cause"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import { hasProperty } from "effect/Predicate"
import type * as Scope from "effect/Scope"
import type { DefaultEventMap } from "./ElementSource.js"
import { ElementSource, getElements } from "./ElementSource.js"
import { adjustTime } from "./internal/utils.js"

export const ElementRefTypeId = Symbol.for("@typed/template/ElementRef")
export type ElementRefTypeId = typeof ElementRefTypeId

/**
 * A reference to a rendered element.
 * @since 1.0.0
 */
export interface ElementRef<T extends Rendered = Rendered> extends
  Versioned<
    never,
    never,
    T,
    never,
    Scope.Scope,
    T,
    NoSuchElementException,
    never
  >
{
  readonly [ElementRefTypeId]: RefSubject.RefSubject<Option.Option<T>>

  readonly query: ElementSource<T>["query"]
  readonly events: ElementSource<T>["events"]
  readonly elements: ElementSource<T>["elements"]
  readonly dispatchEvent: ElementSource<T>["dispatchEvent"]
}

const strictEqual = Option.getEquivalence((a, b) => a === b)

/**
 * @since 1.0.0
 */
export function make<T extends Rendered = Rendered>(): Effect.Effect<
  ElementRef<T>,
  never,
  Scope.Scope
> {
  return Effect.map(
    RefSubject.of(Option.none<T>(), { eq: strictEqual }),
    (ref) => new ElementRefImpl(ref) as any as ElementRef<T>
  )
}

/**
 * @since 1.0.0
 */
export function of<T extends Rendered>(
  rendered: T
): Effect.Effect<ElementRef<T>, never, Scope.Scope> {
  return Effect.map(
    RefSubject.of(Option.some<T>(rendered), { eq: strictEqual }),
    (ref) => new ElementRefImpl(ref) as any as ElementRef<T>
  )
}

// @ts-expect-error Missing PlaceholderTypeId
class ElementRefImpl<T extends Rendered> extends FxEffectBase<T, never, Scope.Scope, T, NoSuchElementException, never>
  implements ElementRef<T>
{
  readonly [ElementRefTypeId]: RefSubject.RefSubject<Option.Option<T>>

  private source: ElementSource<T, DefaultEventMap<T>>

  readonly query: ElementRef<T>["query"]
  readonly events: ElementRef<T>["events"]
  readonly elements: ElementRef<T>["elements"]
  readonly version: ElementRef<T>["version"]
  readonly dispatchEvent: ElementRef<T>["dispatchEvent"]

  constructor(readonly ref: RefSubject.RefSubject<Option.Option<T>>) {
    super()
    this[ElementRefTypeId] = ref
    this.source = ElementSource(RefSubject.compact(ref))
    this.query = this.source.query
    this.events = this.source.events
    this.elements = this.source.elements
    this.dispatchEvent = this.source.dispatchEvent
    this.version = ref.version
  }

  toFx(): Fx<T, never, Scope.Scope> {
    return compact(this.ref)
  }

  toEffect(): Effect.Effect<T, NoSuchElementException> {
    return Effect.flatten(this.ref)
  }
}

/**
 * @since 1.0.0
 */
export const set: {
  <A extends Rendered>(
    value: A
  ): (elementRef: ElementRef<A>) => Effect.Effect<A>
  <A extends Rendered>(elementRef: ElementRef<A>, value: A): Effect.Effect<A>
} = dual(2, function set<
  A extends Rendered
>(elementRef: ElementRef<A>, value: A) {
  return Effect.as(
    RefSubject.set(elementRef[ElementRefTypeId], Option.some(value)),
    value
  )
})

/**
 * @since 1.0.0
 */
export function dispatchEvent<T extends Rendered>(
  ref: ElementRef<T>,
  event: Event
) {
  return ref.pipe(
    Effect.flatMap((rendered) => {
      const elements = getElements(rendered)
      if (elements.length === 0) return Option.none()
      // TODO: How should we manage multiple elements?
      return Effect.sync(() => elements[0].dispatchEvent(event))
    }),
    // Allow changes to take place
    Effect.zipRight(adjustTime(1)),
    // Allow additional fibers to start
    Effect.zipRight(adjustTime(1))
  )
}

export function isElementRef(value: unknown): value is ElementRef {
  return hasProperty(value, ElementRefTypeId)
}
