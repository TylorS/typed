import { Computed } from "@typed/fx/Computed"
import type { Fx } from "@typed/fx/Fx"
import { compact } from "@typed/fx/Fx"
import type { VersionedFxEffect } from "@typed/fx/FxEffect"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import * as RefSubject from "@typed/fx/RefSubject"
import { type ElementSource, ElementSourceImpl } from "@typed/template/ElementSource"
import { type Rendered } from "@typed/wire"
import { Effect, Option } from "effect"

export const ElementRefTypeId = Symbol.for("@typed/template/ElementRef")
export type ElementRefTypeId = typeof ElementRefTypeId

/**
 * A reference to a rendered element.
 * @since 1.0.0
 */
export interface ElementRef<T extends Rendered = Rendered>
  extends VersionedFxEffect<never, never, never, T, never, never, Option.Option<T>>, ElementSource<T>
{
  readonly [ElementRefTypeId]: RefSubject.RefSubject<never, Option.Option<T>>
  readonly set: (rendered: T) => Effect.Effect<never, never, T>
}

const strictEqual = Option.getEquivalence((a, b) => a === b)

export function ElementRef<T extends Rendered = Rendered>(): Effect.Effect<never, never, ElementRef<T>> {
  return Effect.map(
    RefSubject.of(Option.none<T>(), strictEqual),
    (ref) => new ElementRefImpl(ref) as any as ElementRef<T>
  )
}

class ElementRefImpl<T extends Rendered> extends FxEffectProto<never, never, T, never, never, Option.Option<T>>
  implements Omit<ElementRef<T>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [ElementRefTypeId]: RefSubject.RefSubject<never, Option.Option<T>>

  private source = new ElementSourceImpl(Computed<never, never, T, never, never, T>(this as any, Effect.succeed))

  readonly selectors = this.source.selectors

  constructor(readonly ref: RefSubject.RefSubject<never, Option.Option<T>>) {
    super()
    this[ElementRefTypeId] = ref
  }

  protected toFx(): Fx<never, never, T> {
    return compact(this.ref)
  }

  protected toEffect(): Effect.Effect<never, never, Option.Option<T>> {
    return this.ref
  }

  set(rendered: T): Effect.Effect<never, never, T> {
    return Effect.as(this.ref.set(Option.some(rendered)), rendered)
  }

  version = this.ref.version

  get = this.ref.get

  query = this.source.query
  events = this.source.events
  elements = this.source.elements
}
