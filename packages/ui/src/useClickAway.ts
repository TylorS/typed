/**
 * @since 1.0.0
 */

import { Document } from "@typed/dom/Document"
import type { EventWithCurrentTarget } from "@typed/dom/EventTarget"
import * as Fx from "@typed/fx/Fx"
import type * as ElementRef from "@typed/template/ElementRef"
import { getElements } from "@typed/template/ElementSource"
import type { Rendered } from "@typed/wire"
import type * as Effect from "effect/Effect"
import type * as Fiber from "effect/Fiber"
import * as Option from "effect/Option"
import type * as Scope from "effect/Scope"
import { addEventListeners } from "./internal/addEventListener.js"

/**
 * @since 1.0.0
 */
export function useClickAway<Refs extends ReadonlyArray<ElementRef.ElementRef<any>>, R2>(
  refs: Refs,
  f: (event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>) => Effect.Effect<unknown, never, R2>
): Effect.Effect<Fiber.RuntimeFiber<void>, never, Document | Scope.Scope | R2> {
  return Fx.forkScoped(onClickAway(refs, f))
}

/**
 * @since 1.0.0
 */
export function onClickAway<Refs extends ReadonlyArray<ElementRef.ElementRef<any>>, B, E2, R2>(
  refs: Refs,
  f: (event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>) => Effect.Effect<B, E2, R2>
): Fx.Fx<B, E2, Document | R2 | Scope.Scope> {
  return Fx.fromFxEffect(Document.with((document) => {
    const events = addEventListeners(document, "click", "touchend", "contextmenu")
    const elements = Fx.map(
      Fx.tuple(refs as ReadonlyArray<Fx.Fx<Rendered, never, Scope.Scope>>),
      (els) => els.flatMap(getElements)
    )

    return Fx.mapEffect(
      Fx.compact(Fx.snapshot(events, elements, containsRefs)),
      f
    )
  }))
}

const containsRefs = (
  event: EventWithCurrentTarget<Document, MouseEvent | TouchEvent>,
  refs: ReadonlyArray<Element>
): Option.Option<EventWithCurrentTarget<Document, MouseEvent | TouchEvent>> => {
  const target = event.target

  if (
    target === null ||
    refs.some(
      (c) =>
        c === target ||
        c.contains(target as Node)
    )
  ) {
    return Option.none()
  } else {
    return Option.some(event)
  }
}
