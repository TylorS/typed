import type { Fx } from "@typed/fx/Fx"
import { compact } from "@typed/fx/Fx"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import * as RefSubject from "@typed/fx/RefSubject"
import type { Versioned } from "@typed/fx/Versioned"
import { type ElementSource, ElementSourceImpl } from "@typed/template/ElementSource"
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
export interface ElementRef<T extends Rendered = Rendered, E = never>
  extends Versioned<never, never, E, T, never, E | NoSuchElementException, T>
{
  readonly [ElementRefTypeId]: RefSubject.RefSubject<never, E, Option.Option<T>>

  readonly query: ElementSource<T, E>["query"]
  readonly events: ElementSource<T, E>["events"]
  readonly elements: ElementSource<T, E>["elements"]
}

const strictEqual = Option.getEquivalence((a, b) => a === b)

export function ElementRef<T extends Rendered = Rendered, E = never>(): Effect.Effect<never, never, ElementRef<T, E>> {
  return Effect.map(
    RefSubject.of(Option.none<T>(), strictEqual),
    (ref) => new ElementRefImpl(ref) as any as ElementRef<T, E>
  )
}

export function of<T extends Rendered, E = never>(rendered: T): Effect.Effect<never, never, ElementRef<T, E>> {
  return Effect.map(
    RefSubject.of(Option.some<T>(rendered), strictEqual),
    (ref) => new ElementRefImpl(ref) as any as ElementRef<T, E>
  )
}

class ElementRefImpl<T extends Rendered, E> extends FxEffectProto<never, E, T, never, E | NoSuchElementException, T>
  implements Omit<ElementRef<T, E>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [ElementRefTypeId]: RefSubject.RefSubject<never, E, Option.Option<T>>

  private source = new ElementSourceImpl(RefSubject.compact(this.ref))

  readonly selectors = this.source.selector

  constructor(readonly ref: RefSubject.RefSubject<never, E, Option.Option<T>>) {
    super()
    this[ElementRefTypeId] = ref
  }

  protected toFx(): Fx<never, E, T> {
    return compact(this.ref)
  }

  protected toEffect(): Effect.Effect<never, E | NoSuchElementException, T> {
    return Effect.flatten(this.ref.get)
  }

  version = this.ref.version

  query = this.source.query
  events = this.source.events
  elements = this.source.elements
}

export const set: {
  <A extends Rendered>(value: A): <E>(elementRef: ElementRef<A, E>) => Effect.Effect<never, never, A>
  <A extends Rendered, E>(elementRef: ElementRef<A, E>, value: A): Effect.Effect<never, never, A>
} = dual(2, function set<A extends Rendered>(elementRef: ElementRef<A>, value: A) {
  return Effect.as(elementRef[ElementRefTypeId].set(Option.some(value)), value)
})
