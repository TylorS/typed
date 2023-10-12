import * as Fx from "@typed/fx/Fx"
import type { ElementRef } from "@typed/template/ElementRef"
import type { Parts } from "@typed/template/Part"
import type { Placeholder } from "@typed/template/Placeholder"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { Rendered } from "@typed/wire"
import type { NoSuchElementException } from "effect/Cause"
import type { Effect } from "effect/Effect"

export const TemplateInstanceTypeId = Symbol.for("@typed/template/TemplateInstance")
export type TemplateInstanceTypeId = typeof TemplateInstanceTypeId

export interface TemplateInstance<E, T extends Rendered = Rendered> extends Fx.Fx<never, E, RenderEvent> {
  readonly [TemplateInstanceTypeId]: ElementRef<T>
  readonly parts: Parts

  readonly get: Effect<never, NoSuchElementException, T>
  readonly query: ElementRef<T>["query"]
  readonly events: ElementRef<T>["events"]
  readonly elements: ElementRef<T>["elements"]
}

export function TemplateInstance<E, T extends Rendered = Rendered>(
  events: Fx.Fx<never, E, RenderEvent>,
  errors: Fx.Fx<never, E, never>,
  ref: ElementRef<T>,
  parts: Parts
): TemplateInstance<E, T> {
  return new TemplateInstanceImpl(events, errors, ref, parts) as any
}

class TemplateInstanceImpl<E, T extends Rendered> extends Fx.ToFx<never, E, RenderEvent>
  implements Omit<TemplateInstance<E, T>, keyof Placeholder<never, E, RenderEvent>>
{
  readonly [TemplateInstanceTypeId] = this.i2

  constructor(
    readonly i0: Fx.Fx<never, E, RenderEvent>,
    readonly i1: Fx.Fx<never, E, never>,
    readonly i2: ElementRef<T>,
    readonly parts: Parts
  ) {
    super(i0, i1, i2)
  }

  toFx(): Fx.Fx<never, E, RenderEvent> {
    return Fx.merge([this.i0, this.i1])
  }

  get = this.i2
  query = this.i2.query
  events = this.i2.events
  elements = this.i2.elements
}
