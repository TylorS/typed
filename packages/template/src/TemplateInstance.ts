import type * as Fx from "@typed/fx/Fx"
import type { ElementRef } from "@typed/template/ElementRef"
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
