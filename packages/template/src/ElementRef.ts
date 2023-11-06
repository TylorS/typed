import type { Fx } from "@typed/fx/Fx"
import { compact } from "@typed/fx/Fx"
import { FxEffectBase } from "@typed/fx/internal/protos"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Versioned } from "@typed/fx/Versioned"
import { type ElementSource, ElementSourceImpl } from "@typed/template/ElementSource"
import type { Placeholder } from "@typed/template/Placeholder"
import { type Rendered } from "@typed/wire"
import { Effect, Option } from "effect"
import type { NoSuchElementException } from "effect/Cause"
import { dual } from "effect/Function"

export const ElementRefTypeId = Symbol.for("@typed/template/ElementRef")
export type ElementRefTypeId = typeof ElementRefTypeId

/**
 * A reference to a rendered element.
 * @since 1.0.0
 */
export interface ElementRef<T extends Rendered = Rendered>
  extends Versioned<never, never, never, T, never, NoSuchElementException, T>
{
  readonly [ElementRefTypeId]: RefSubject.RefSubject<never, never, Option.Option<T>>

  readonly query: ElementSource<T>["query"]
  readonly events: ElementSource<T>["events"]
  readonly elements: ElementSource<T>["elements"]
}

const strictEqual = Option.getEquivalence((a, b) => a === b)

export function ElementRef<T extends Rendered = Rendered>(): Effect.Effect<never, never, ElementRef<T>> {
  return Effect.map(
    RefSubject.of(Option.none<T>(), strictEqual),
    (ref) => new ElementRefImpl(ref) as any as ElementRef<T>
  )
}

export function of<T extends Rendered>(rendered: T): Effect.Effect<never, never, ElementRef<T>> {
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

  private source = new ElementSourceImpl(RefSubject.compact(this.ref))

  readonly selectors = this.source.selector

  constructor(readonly ref: RefSubject.RefSubject<never, never, Option.Option<T>>) {
    super()
    this[ElementRefTypeId] = ref
  }

  protected toFx(): Fx<never, never, T> {
    return compact(this.ref)
  }

  protected toEffect(): Effect.Effect<never, NoSuchElementException, T> {
    return Effect.flatten(this.ref.get)
  }

  version = this.ref.version

  query = this.source.query
  events = this.source.events
  elements = this.source.elements
}

export const set: {
  <A extends Rendered>(value: A): (elementRef: ElementRef<A>) => Effect.Effect<never, never, A>
  <A extends Rendered>(elementRef: ElementRef<A>, value: A): Effect.Effect<never, never, A>
} = dual(2, function set<A extends Rendered>(elementRef: ElementRef<A>, value: A) {
  return Effect.as(elementRef[ElementRefTypeId].set(Option.some(value)), value)
})
