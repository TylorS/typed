/**
 * @since 1.0.0
 */

import type * as Fx from "@typed/fx/Fx"
import { FxEffectBase } from "@typed/fx/Fx"
import type * as Versioned from "@typed/fx/Versioned"
import type { Rendered } from "@typed/wire"
import type { NoSuchElementException } from "effect/Cause"
import type * as Effect from "effect/Effect"
import { type ElementRef, ElementRefTypeId } from "./ElementRef"
import type { Placeholder } from "./Placeholder"
import type { RenderEvent } from "./RenderEvent"

/**
 * @since 1.0.0
 */
export const TemplateInstanceTypeId = Symbol.for("./TemplateInstance")
/**
 * @since 1.0.0
 */
export type TemplateInstanceTypeId = typeof TemplateInstanceTypeId

/**
 * @since 1.0.0
 */
export interface TemplateInstance<E, T extends Rendered = Rendered>
  extends Versioned.Versioned<never, never, never, E, RenderEvent, never, E | NoSuchElementException, T>
{
  readonly [TemplateInstanceTypeId]: TemplateInstanceTypeId

  readonly query: ElementRef<T>["query"]

  readonly events: ElementRef<T>["events"]

  readonly elements: ElementRef<T>["elements"]

  readonly dispatchEvent: ElementRef<T>["dispatchEvent"]
}

/**
 * @since 1.0.0
 */
export function TemplateInstance<T extends Rendered = Rendered, E = never>(
  events: Fx.Fx<never, E, RenderEvent>,
  ref: ElementRef<T>
): TemplateInstance<E, T> {
  return new TemplateInstanceImpl(events, ref) as any
}

// @ts-expect-error placeholder issues
class TemplateInstanceImpl<E, T extends Rendered>
  extends FxEffectBase<never, E, RenderEvent, never, E | NoSuchElementException, T>
  implements Omit<TemplateInstance<E, T>, keyof Placeholder<never, E, RenderEvent>>
{
  readonly [TemplateInstanceTypeId]: TemplateInstanceTypeId = TemplateInstanceTypeId
  query: TemplateInstance<E, T>["query"]
  events: TemplateInstance<E, T>["events"]
  elements: TemplateInstance<E, T>["elements"]
  dispatchEvent: TemplateInstance<E, T>["dispatchEvent"]
  version: Effect.Effect<never, never, number>

  constructor(
    readonly i0: Fx.Fx<never, E, RenderEvent>,
    readonly i1: ElementRef<T>
  ) {
    super()

    this.query = this.i1.query
    this.events = this.i1.events
    this.elements = this.i1.elements
    this.dispatchEvent = this.i1.dispatchEvent
    this.version = this.i1[ElementRefTypeId].version
  }

  toFx(): Fx.Fx<never, E, RenderEvent> {
    return this.i0
  }

  toEffect(): Effect.Effect<never, E | NoSuchElementException, T> {
    return this.i1
  }
}
