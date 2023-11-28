/**
 * @since 1.0.0
 */
import type { Fx } from "@typed/fx/Fx"
import { compact, FxEffectBase } from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Versioned } from "@typed/fx/Versioned"
import { type Rendered } from "@typed/wire"
import type { Scope } from "effect"
import { Effect, Option } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import { dual } from "effect/Function"
import type { DefaultEventMap } from "./ElementSource"
import { ElementSource, getElements } from "./ElementSource"
import { adjustTime } from "./internal/utils"
import type { Placeholder } from "./Placeholder"

export const ElementRefTypeId = Symbol.for("./ElementRef")
export type ElementRefTypeId = typeof ElementRefTypeId

/**
 * A reference to a rendered element.
 * @since 1.0.0
 */
export interface ElementRef<T extends Rendered = Rendered>
  extends Versioned<never, never, never, never, T, never, NoSuchElementException, T>
{
  readonly [ElementRefTypeId]: RefSubject.RefSubject<never, never, Option.Option<T>>

  readonly query: ElementSource<T>["query"]
  readonly events: ElementSource<T>["events"]
  readonly elements: ElementSource<T>["elements"]
  readonly dispatchEvent: ElementSource<T>["dispatchEvent"]
}

const strictEqual = Option.getEquivalence((a, b) => a === b)

/**
 * @since 1.0.0
 */
export function make<T extends Rendered = Rendered>(): Effect.Effect<Scope.Scope, never, ElementRef<T>> {
  return Effect.map(
    RefSubject.of(Option.none<T>(), strictEqual),
    (ref) => new ElementRefImpl(ref) as any as ElementRef<T>
  )
}

/**
 * @since 1.0.0
 */
export function of<T extends Rendered>(rendered: T): Effect.Effect<Scope.Scope, never, ElementRef<T>> {
  return Effect.map(
    RefSubject.of(Option.some<T>(rendered), strictEqual),
    (ref) => new ElementRefImpl(ref) as any as ElementRef<T>
  )
}

// @ts-expect-error placeholder issues
class ElementRefImpl<T extends Rendered> extends FxEffectBase<never, never, T, never, NoSuchElementException, T>
  implements
    Omit<ElementRef<T>, keyof Placeholder<never, never, T> | keyof Placeholder<never, NoSuchElementException, T>>
{
  readonly [ElementRefTypeId]: RefSubject.RefSubject<never, never, Option.Option<T>>

  private source: ElementSource<
    T,
    DefaultEventMap<T>
  >

  readonly query: ElementRef<T>["query"]
  readonly events: ElementRef<T>["events"]
  readonly elements: ElementRef<T>["elements"]
  readonly version: ElementRef<T>["version"]
  readonly dispatchEvent: ElementRef<T>["dispatchEvent"]

  constructor(readonly ref: RefSubject.RefSubject<never, never, Option.Option<T>>) {
    super()
    this[ElementRefTypeId] = ref
    this.source = ElementSource(RefSubject.compact(ref))
    this.query = this.source.query
    this.events = this.source.events
    this.elements = this.source.elements
    this.dispatchEvent = this.source.dispatchEvent
    this.version = ref.version
  }

  protected toFx(): Fx<never, never, T> {
    return compact(this.ref)
  }

  protected toEffect(): Effect.Effect<never, NoSuchElementException, T> {
    return Effect.flatten(this.ref.get)
  }
}

/**
 * @since 1.0.0
 */
export const set: {
  <A extends Rendered>(value: A): (elementRef: ElementRef<A>) => Effect.Effect<never, never, A>
  <A extends Rendered>(elementRef: ElementRef<A>, value: A): Effect.Effect<never, never, A>
} = dual(2, function set<A extends Rendered>(elementRef: ElementRef<A>, value: A) {
  return Effect.as(elementRef[ElementRefTypeId].set(Option.some(value)), value)
})

/**
 * @since 1.0.0
 */
export function dispatchEvent<T extends Rendered>(ref: ElementRef<T>, event: Event) {
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
