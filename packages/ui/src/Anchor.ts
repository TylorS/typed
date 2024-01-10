/**
 * @since 1.0.0
 */

import type { EventWithCurrentTarget } from "@typed/dom/EventTarget"
import * as Fx from "@typed/fx/Fx"
import * as Directive from "@typed/template/Directive"
import type { DefaultEventMap, ElementSource } from "@typed/template/ElementSource"
import * as EventHandler from "@typed/template/EventHandler"
import type { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import type { RenderEvent } from "@typed/template/RenderEvent"
import { html, type RenderTemplate } from "@typed/template/RenderTemplate"
import type { Rendered } from "@typed/wire"
import type { ReadonlyRecord, Scope } from "effect"
import * as Effect from "effect/Effect"
import { uncapitalize } from "effect/String"
import type { HTMLAnchorElementProperties } from "./internal/dom-properties.js"

/**
 * @since 1.0.0
 */
export type AnchorProps =
  & {
    readonly [K in keyof HTMLAnchorElementProperties]?:
      | HTMLAnchorElementProperties[K]
      | Placeholder.Any<HTMLAnchorElementProperties[K]>
      | undefined
  }
  & {
    readonly ref?: ((ref: ElementSource<HTMLAnchorElement>) => Effect.Effect<any, any, any>) | undefined
    readonly data?: Placeholder.Any<ReadonlyRecord.ReadonlyRecord<any>> | undefined
  }
  & EventHandlerProps<HTMLAnchorElement>

/**
 * @since 1.0.0
 */
export type EventHandlerProps<El extends HTMLElement | SVGElement, EventMap extends {} = DefaultEventMap<El>> = {
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
type ReturnOf<T> = T extends (...args: any) => infer R ? R : never

/**
 * @since 1.0.0
 */
export function Anchor<
  const Props extends AnchorProps,
  Children extends ReadonlyArray<Renderable<any, any>> = readonly []
>(
  props: Props,
  ...children: Children
): Fx.Fx<
  RenderTemplate | Scope.Scope | Placeholder.Context<Props[keyof Props] | ReturnOf<Props["ref"]> | Children[number]>,
  Placeholder.Error<Props[keyof Props] | ReturnOf<Props["ref"]> | Children[number]>,
  RenderEvent
> {
  const {
    data,
    hash,
    host,
    hostname,
    href,
    hreflang,
    pathname,
    port,
    protocol,
    ref,
    scrollLeft,
    scrollTop,
    search,
    ...rest
  } = props

  const refDirective = Directive.ref(({ value }) =>
    Effect.gen(function*(_) {
      yield* _(addEventListeners(props, value))

      if (ref) {
        yield* _(ref(value as any))
      }
    })
  )
  return html`<a 
    ref="${refDirective}"
    .props="${rest}"
    .data="${data}"
    .scrollLeft="${scrollLeft}"
    .scrollTop="${scrollTop}"
    .hash="${hash}"
    .host="${host}"
    .hostname="${hostname}"
    .href="${href}"
    .hreflang="${hreflang}"
    .pathname="${pathname}"
    .port="${port}"
    .protocol="${protocol}"
    .search="${search}"
  >${children}</a>` as any
}

/**
 * @since 1.0.0
 */
export function addEventListeners<Props extends EventHandlerProps<any>, T extends Rendered>(
  props: Props,
  ref: ElementSource<T>
): Effect.Effect<Scope.Scope | GetEventHandlersContext<Props>, never, void> {
  return Fx.forkScoped(
    Fx.mergeAll(
      getEventHandlers(props).map(([type, handler]: any) => addEventListener(ref, type, handler))
    )
  ) as any
}

function addEventListener<T extends Rendered, R, E, Ev extends Event>(
  ref: ElementSource<T>,
  event: string,
  handler: EventHandler.EventHandler<R, E, Ev>
) {
  return Fx.mapEffect(ref.events(event as any, handler.options), (ev) => handler.handler(ev as any))
}

type ValuesOf<T> = [T[keyof T]] extends [infer R] ? R : never

type ToEventType<T> = T extends `on${infer S}` ? Uncapitalize<S> : never

/**
 * @since 1.0.0
 */
export type GetEventHandlersContext<T extends EventHandlerProps<any>> = ValuesOf<
  {
    readonly [K in keyof T as K extends `on${string}` ? K : never]: EventHandler.Context<GetEventHandler<T[K]>>
  }
>

/**
 * @since 1.0.0
 */
export type GetEventHandlers<T extends EventHandlerProps<any>> = [
  ReadonlyArray<
    ValuesOf<
      {
        readonly [K in keyof T as K extends `on${string}` ? K : never]: readonly [ToEventType<K>, GetEventHandler<T[K]>]
      }
    >
  >
] extends [ReadonlyArray<infer R>] ? ReadonlyArray<R> : never

type GetEventHandler<
  T
> = T extends EventHandler.EventHandler<infer R, infer E, infer Ev> ? EventHandler.EventHandler<R, E, Ev>
  : T extends Effect.Effect<infer R, infer E, infer _> ? EventHandler.EventHandler<R, E, Event>
  : never

/**
 * @since 1.0.0
 */
export function getEventHandlers<Props extends EventHandlerProps<any>>(props: Props) {
  const eventHandlers: Array<readonly [string, EventHandler.EventHandler<any, any, any>]> = Object.keys(props).filter((
    x
  ) => x[0] === "o" && x[1] === "n").flatMap((key) => {
    const handler = getEventHandler(
      props[key as keyof typeof props] as
        | EventHandler.EventHandler<any, any, any>
        | Effect.Effect<any, any, unknown>
        | null
        | undefined
    )

    if (!handler) return []

    const eventType = uncapitalize(key.slice(2))

    return [[eventType, handler] as const]
  })

  return eventHandlers as any as GetEventHandlers<Props>
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
