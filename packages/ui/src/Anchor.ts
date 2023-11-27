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
import type { TemplateFx } from "@typed/template/RenderTemplate"
import { html } from "@typed/template/RenderTemplate"
import type { Rendered } from "@typed/wire"
import type { ReadonlyRecord, Scope } from "effect"
import { Effect } from "effect"
import { uncapitalize } from "effect/String"
import type { HTMLAnchorElementProperties } from "./internal/dom-properties"

/**
 * @since 1.0.0
 */
export type AnchorProps =
  & {
    readonly [K in keyof HTMLAnchorElementProperties]:
      | HTMLAnchorElementProperties[K]
      | Placeholder.Any<HTMLAnchorElementProperties[K]>
      | Directive.Directive<any, any>
  }
  & {
    readonly ref?: (ref: ElementSource<HTMLAnchorElement>) => Effect.Effect<any, any, any>
    readonly data?: Placeholder.Any<ReadonlyRecord.ReadonlyRecord<any>>
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
): TemplateFx<
  Placeholder.Context<Props[keyof Props] | ReturnOf<Props["ref"]> | Children[number]>,
  Placeholder.Error<Props[keyof Props] | ReturnOf<Props["ref"]> | Children[number]>,
  HTMLAnchorElement
> {
  const ref = Directive.ref(({ value: ref }) =>
    Effect.gen(function*(_) {
      yield* _(addEventListeners(props, ref))

      if (props.ref) {
        yield* _(props.ref(ref as any))
      }
    })
  )
  return html`<a 
    ref="${ref}"
    .data="${props.data}"
    ?hidden="${props.hidden}"
    ?hidefocus="${props.hideFocus}"
    ?spellcheck="${props.spellcheck}"
    .scrollLeft="${props.scrollLeft}"
    .scrollTop="${props.scrollTop}"
    accesskey="${props.accessKey}"
    charset="${props.charset}"
    class="${props.className}"
    contenteditable="${props.contentEditable}"
    coords="${props.coords}"
    dir="${props.dir}"
    download="${props.download}"
    draggable="${props.draggable}"
    .hash="${props.hash}"
    .host="${props.host}"
    .hostname="${props.hostname}"
    .href="${props.href}"
    hreflang="${props.hreflang}"
    id="${props.id}"
    id="${props.id}" 
    lang="${props.lang}"
    Methods="${props.Methods}"
    name="${props.name}"
    .pathname="${props.pathname}"
    .port="${props.port}"
    .protocol="${props.protocol}"
    rel="${props.rel}"
    rev="${props.rev}"
    .search="${props.search}"
    shape="${props.shape}"
    slot="${props.slot}"
    tabindex="${props.tabIndex}"
    target="${props.target}"
    text="${props.text}"
    title="${props.title}"
    type="${props.type}"
    urn="${props.urn}"
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
    Fx.merge(
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
