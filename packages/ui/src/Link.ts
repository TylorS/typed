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
import * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"
import { Anchor, type AnchorProps, getEventHandler } from "./Anchor.js"

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
  { onClick, ref, relative, replace, state, to, ...props }: Props,
  ...children: Children
): Fx.Fx<
  | Navigation.Navigation
  | CurrentRoute
  | RenderTemplate
  | Scope.Scope
  | Placeholder.Context<Props[keyof Props] | Children[number]>
  | Fx.Context<Props[keyof Props] | Children[number]>,
  Placeholder.Error<Props[keyof Props] | Children[number]> | Fx.Error<Props[keyof Props] | Children[number]>,
  RenderEvent
> {
  return Fx.gen(function*(_) {
    const onClickHandler = getEventHandler(onClick)
    const toRef = yield* _(
      Placeholder.asRef<Placeholder.Context<Props["to"]>, Placeholder.Error<Props["to"]>, string>(to)
    )
    const relativeRef = yield* _(
      Placeholder.asRef<Placeholder.Context<Props["relative"]>, Placeholder.Error<Props["relative"]>, boolean>(
        relative ?? true
      )
    )
    const replaceRef = yield* _(
      Placeholder.asRef<Placeholder.Context<Props["replace"]>, Placeholder.Error<Props["replace"]>, boolean>(
        replace ?? false
      )
    )
    const stateRef = yield* _(
      Placeholder.asRef<Placeholder.Context<Props["state"]>, Placeholder.Error<Props["state"]>, unknown>(
        state as Placeholder.Any<unknown>
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

    const href = RefSubject.mapEffect(
      RefSubject.tuple([relativeRef, toRef]),
      ([rel, to]) => rel ? makeHref(to) : Effect.succeed(to)
    )

    const navigate = Effect.gen(function*(_) {
      const current = yield* _(Effect.all({ replace: replaceRef, state: stateRef, reloadDocument }))
      const url = yield* _(href)

      yield* _(Navigation.navigate(url, {
        history: current.replace ? "replace" : "auto",
        state: current.state
      }))

      if (current.reloadDocument) {
        yield* _(Navigation.reload({ state: current.state }))
      }
    })

    const onClickEventHandler = EventHandler.preventDefault(
      (ev: EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>) =>
        Effect.gen(function*(_) {
          if (onClickHandler) {
            yield* _(onClickHandler.handler(ev))
          }
          yield* _(navigate)
        }),
      onClickHandler?.options
    )

    const allProps = { ...props, ref, href, state: stateRef, onClick: onClickEventHandler }

    return Anchor(
      allProps as any as AnchorProps,
      ...children
    )
  })
}
