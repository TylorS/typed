/**
 * @since 1.0.0
 */
import type { EventWithCurrentTarget } from "@typed/dom/EventTarget"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Navigation from "@typed/navigation"
import type { CurrentRoute } from "@typed/router"
import { makeHref } from "@typed/router"
import * as EventHandler from "@typed/template/EventHandler"
import { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { RenderTemplate } from "@typed/template/RenderTemplate"
import { Effect, type Scope } from "effect"
import { Anchor, type AnchorProps, getEventHandler } from "./Anchor"

/**
 * @since 1.0.0
 */
export type LinkProps = Omit<AnchorProps, keyof URL> & {
  readonly to: string | Placeholder.Any<string>
  readonly relative?: boolean | Placeholder.Any<boolean>
  readonly replace?: boolean | Placeholder.Any<boolean>
  readonly state?: unknown | Placeholder.Any<unknown>
  readonly reloadDocument?: boolean | Placeholder.Any<boolean>
}

/**
 * @since 1.0.0
 */
export function Link<Props extends LinkProps, Children extends ReadonlyArray<Renderable<any, any>> = readonly []>(
  props: Props,
  ...children: Children
): Fx.Fx<
  | Navigation.Navigation
  | CurrentRoute
  | RenderTemplate
  | Scope.Scope
  | Location
  | Placeholder.Context<Props[keyof Props] | Children[number]>,
  Placeholder.Error<Props[keyof Props] | Children[number]>,
  RenderEvent
> {
  return Fx.gen(function*(_) {
    const onClickHandler = getEventHandler(props.onClick)
    const to = yield* _(
      Placeholder.asRef<Placeholder.Context<Props["to"]>, Placeholder.Error<Props["to"]>, string>(props.to)
    )
    const relative = yield* _(
      Placeholder.asRef<Placeholder.Context<Props["relative"]>, Placeholder.Error<Props["relative"]>, boolean>(
        props.relative ?? true
      )
    )
    const replace = yield* _(
      Placeholder.asRef<Placeholder.Context<Props["replace"]>, Placeholder.Error<Props["replace"]>, boolean>(
        props.replace ?? false
      )
    )
    const state = yield* _(
      Placeholder.asRef<Placeholder.Context<Props["state"]>, Placeholder.Error<Props["state"]>, unknown>(
        props.state as Placeholder.Any<unknown>
      )
    )
    const reloadDocument = yield* _(
      Placeholder.asRef<
        Placeholder.Context<Props["reloadDocument"]>,
        Placeholder.Error<Props["reloadDocument"]>,
        boolean
      >(
        props.reloadDocument ?? false
      )
    )

    const href = RefSubject.tuple(relative, to).mapEffect(([rel, to]) => rel ? makeHref(to) : Effect.succeed(to))

    const navigate = Effect.gen(function*(_) {
      const current = yield* _(Effect.all({ replace, state, reloadDocument }))
      const url = yield* _(href)

      yield* _(Navigation.navigate(url, {
        history: current.replace ? "replace" : "auto",
        state: current.state
      }))

      if (current.reloadDocument) {
        yield* _(Navigation.reload({ state: current.state }))
      }
    })

    const onClick = EventHandler.preventDefault(
      (ev: EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>) =>
        Effect.gen(function*(_) {
          if (onClickHandler) {
            yield* _(onClickHandler.handler(ev))
          }
          yield* _(navigate)
        }),
      onClickHandler?.options
    )

    return Anchor({ ...props, href, state, onClick }, ...children)
  })
}