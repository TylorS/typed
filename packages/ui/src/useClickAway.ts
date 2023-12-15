/**
 * @since 1.0.0
 */

import { Document } from "@typed/dom/Document"
import type { EventWithCurrentTarget } from "@typed/dom/EventTarget"
import * as Fx from "@typed/fx/Fx"
import type * as ElementRef from "@typed/template/ElementRef"
import { getElements } from "@typed/template/ElementSource"
import type { Rendered } from "@typed/wire"
import type { Fiber, Scope } from "effect"
import { Effect, Option } from "effect"
import { addEventListeners } from "./internal/addEventListener"

/**
 * @since 1.0.0
 */
export function useClickAway<Refs extends ReadonlyArray<ElementRef.ElementRef<any>>, R2>(
  refs: Refs,
  f: (event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>) => Effect.Effect<R2, never, unknown>
): Effect.Effect<Document | Scope.Scope | R2, never, Fiber.RuntimeFiber<never, void>> {
  return Fx.forkScoped(onClickAway(refs, f))
}

/**
 * @since 1.0.0
 */
export function onClickAway<Refs extends ReadonlyArray<ElementRef.ElementRef<any>>, R2, E2, B>(
  refs: Refs,
  f: (event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>) => Effect.Effect<R2, E2, B>
): Fx.Fx<Document | R2, E2, B> {
  return Fx.fromFxEffect(Document.with((document) => {
    const events = addEventListeners(document, "click", "touchend", "contextmenu")
    const elements = Fx.map(
      Fx.combine(refs as ReadonlyArray<Fx.Fx<never, never, Rendered>>),
      (els) => els.flatMap(getElements)
    )

    return Fx.mapEffect(
      Fx.compact(Fx.snapshot(events, elements, containsRefs)),
      f
    )
  }))
}

const containsRefs = (event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>, refs: ReadonlyArray<Element>) =>
  Effect.sync(() => {
    const target = event.target

    if (
      target === null ||
      refs.some(
        (c) =>
          c === target ||
          c.contains(target as Element)
      )
    ) {
      return Option.none()
    } else {
      return Option.some(event)
    }
  })
