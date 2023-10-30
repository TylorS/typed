import type * as Fx from "@typed/fx/Fx"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import type * as Versioned from "@typed/fx/Versioned"
import { type ElementRef, ElementRefTypeId } from "@typed/template/ElementRef"
import type { Placeholder } from "@typed/template/Placeholder"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { Rendered } from "@typed/wire"
import type { NoSuchElementException } from "effect/Cause"
import type * as Effect from "effect/Effect"

export const TemplateInstanceTypeId = Symbol.for("@typed/template/TemplateInstance")
export type TemplateInstanceTypeId = typeof TemplateInstanceTypeId

export interface TemplateInstance<E, T extends Rendered = Rendered>
  extends Versioned.Versioned<never, never, E, RenderEvent, never, E | NoSuchElementException, T>
{
  readonly [TemplateInstanceTypeId]: TemplateInstanceTypeId

  readonly query: ElementRef<T>["query"]

  readonly events: ElementRef<T>["events"]

  readonly elements: ElementRef<T>["elements"]
}

export function TemplateInstance<T extends Rendered = Rendered, E = never>(
  events: Fx.Fx<never, E, RenderEvent>,
  ref: ElementRef<T>
): TemplateInstance<E, T> {
  return new TemplateInstanceImpl(events, ref) as any
}

class TemplateInstanceImpl<E, T extends Rendered>
  extends FxEffectProto<never, E, RenderEvent, never, E | NoSuchElementException, T>
  implements Omit<TemplateInstance<E, T>, keyof Placeholder<never, E, RenderEvent> | ModuleAgumentedEffectKeysToOmit>
{
  readonly [TemplateInstanceTypeId]: TemplateInstanceTypeId = TemplateInstanceTypeId

  constructor(
    readonly i0: Fx.Fx<never, E, RenderEvent>,
    readonly i1: ElementRef<T>
  ) {
    super(i0, i1)
  }

  toFx(): Fx.Fx<never, E, RenderEvent> {
    return this.i0
  }

  toEffect(): Effect.Effect<never, E | NoSuchElementException, T> {
    return this.i1
  }

  query = this.i1.query
  events = this.i1.events
  elements = this.i1.elements
  version = this.i1[ElementRefTypeId].version
}
