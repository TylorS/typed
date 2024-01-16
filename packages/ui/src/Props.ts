/**
 * @since 1.0.0
 */

import type { EventWithCurrentTarget } from "@typed/dom/EventTarget"
import type { ElementRef } from "@typed/template/ElementRef"
import type { DefaultEventMap } from "@typed/template/ElementSource"
import * as EventHandler from "@typed/template/EventHandler"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Rendered } from "@typed/wire"
import { Effect } from "effect"
import type { ReadonlyRecord } from "effect"

/**
 * @since 1.0.0
 */
export type TypedProps<Input extends Record<string, any>, Element extends Rendered> = [
  & AttrsOf<Input>
  & BooleanAttrsOf<Input>
  & PropsOf<Input>
  & EventsOf<Element>
  & RefOf<Element>
  & DataProps
] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never

/**
 * @since 1.0.0
 */
export type AttrsOf<Props extends Record<string, any>> = {
  readonly [K in keyof Props]?:
    | Props[K]
    | Placeholder.Any<Props[K]>
}

/**
 * @since 1.0.0
 */
export type BooleanAttrsOf<Attrs extends Record<string, any>> = {
  readonly [
    K in keyof Attrs as K extends string ? boolean extends Attrs[K] ? `?${K}` : never : never
  ]?:
    | Attrs[K]
    | Placeholder.Any<Attrs[K]>
}

/**
 * @since 1.0.0
 */
export type PropsOf<Attrs extends Record<string, any>> = {
  readonly [K in keyof Attrs as K extends string ? `.${K}` : never]?: Attrs[K] | Placeholder.Any<Attrs[K]>
}

/**
 * @since 1.0.0
 */
export type EventsOf<El, EventMap extends {} = DefaultEventMap<El>> = {
  readonly [K in keyof EventMap as K extends string ? `on${Capitalize<K>}` : never]?:
    | EventHandler.EventHandler<
      any,
      any,
      EventWithCurrentTarget<El, Extract<EventMap[K], Event>>
    >
    | Effect.Effect<any, any, unknown>
    | null
    | undefined
}

/**
 * @since 1.0.0
 */
export type RefOf<T extends Rendered> = {
  readonly ref?: ElementRef<T> | undefined
}

/**
 * @since 1.0.0
 */
export type DataProps = {
  readonly data?: Placeholder.Any<ReadonlyRecord.ReadonlyRecord<any>> | undefined
}

/**
 * @since 1.0.0
 */
export function getEventHandler<R, E, Ev extends Event = Event>(
  handler: EventHandler.EventHandler<R, E, Ev> | Effect.Effect<R, E, unknown> | null | undefined
): EventHandler.EventHandler<R, E, Ev> | null {
  if (!handler) return null

  if (Effect.isEffect(handler)) {
    return EventHandler.make(() => handler)
  } else {
    return handler
  }
}
