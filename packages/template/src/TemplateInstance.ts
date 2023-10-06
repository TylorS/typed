import * as Fx from "@typed/fx/Fx"
import type { ElementRef } from "@typed/template/ElementRef"
import type { Placeholder } from "@typed/template/Placeholder"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { Rendered } from "@typed/wire"
import type { NoSuchElementException } from "effect/Cause"
import type { Effect } from "effect/Effect"

export const TemplateInstanceTypeId = Symbol.for("@typed/template/TemplateInstance")
export type TemplateInstanceTypeId = typeof TemplateInstanceTypeId

export interface TemplateInstance<E, T extends Rendered = Rendered> extends Fx.Fx<never, E, RenderEvent> {
  readonly [TemplateInstanceTypeId]: ElementRef<T>

  readonly get: Effect<never, NoSuchElementException, T>
  readonly query: ElementRef<T>["query"]
  readonly events: ElementRef<T>["events"]
  readonly elements: ElementRef<T>["elements"]
}

export function TemplateInstance<E, T extends Rendered = Rendered>(
  events: Fx.Fx<never, E, RenderEvent>,
  ref: ElementRef<T>
): TemplateInstance<E, T> {
  return new TemplateInstanceImpl(events, ref) as any
}

class TemplateInstanceImpl<E, T extends Rendered> extends Fx.ToFx<never, E, RenderEvent>
  implements Omit<TemplateInstance<E, T>, keyof Placeholder<never, E, RenderEvent>>
{
  readonly [TemplateInstanceTypeId] = this.i1

  constructor(
    readonly i0: Fx.Fx<never, E, RenderEvent>,
    readonly i1: ElementRef<T>
  ) {
    super(i0, i1)
  }

  toFx(): Fx.Fx<never, E, RenderEvent> {
    return this.i0
  }

  get = this.i1
  query = this.i1.query
  events = this.i1.events
  elements = this.i1.elements
}
