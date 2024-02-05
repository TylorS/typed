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
import { a } from "./hyperscript.js"
import type { TypedPropertiesMap } from "./Props.js"
import { getEventHandler } from "./Props.js"

/**
 * @since 1.0.0
 */
export type LinkProps = Omit<TypedPropertiesMap["a"], keyof URL> & {
  readonly to: string | Placeholder.Any<string>
  readonly relative?: boolean | Placeholder.Any<boolean>
  readonly replace?: boolean | Placeholder.Any<boolean>
  readonly state?: unknown | Placeholder.Any<unknown>
  readonly info?: unknown | Placeholder.Any<unknown>
  readonly reloadDocument?: boolean | Placeholder.Any<boolean>
}

/**
 * @since 1.0.0
 */
export function Link<Props extends LinkProps, Children extends ReadonlyArray<Renderable<any, any>> = readonly []>(
  { onClick, relative, replace, state, to, ...props }: Props,
  ...children: Children
): Fx.Fx<
  | Navigation.Navigation
  | CurrentRoute
  | RenderTemplate
  | Scope.Scope
  | Placeholder.Context<Props[keyof Props] | Children[number]>,
  Placeholder.Error<Props[keyof Props] | Children[number]>,
  RenderEvent
> {
  return Fx.gen(function*(_) {
    const onClickHandler = getEventHandler(onClick)
    const toRef = yield* _(Placeholder.asRef(to))
    const relativeRef = yield* _(Placeholder.asRef(relative ?? true))
    const replaceRef = yield* _(Placeholder.asRef(replace ?? false))
    const stateRef = yield* _(Placeholder.asRef(state))
    const infoRef = yield* _(Placeholder.asRef(props.info))
    const reloadDocument = yield* _(Placeholder.asRef(props.reloadDocument ?? false))
    const href = RefSubject.mapEffect(
      RefSubject.tuple([relativeRef, toRef]),
      ([rel, to]) => rel ? makeHref(to) : Effect.succeed(to)
    )
    const navigate = Effect.gen(function*(_) {
      const replace = yield* _(replaceRef)
      const state = yield* _(stateRef)
      const url = yield* _(href)
      const info = yield* _(infoRef)

      yield* _(Navigation.navigate(url, {
        info,
        history: replace ? "replace" : "auto",
        state
      }))

      if (yield* _(reloadDocument)) {
        yield* _(Navigation.reload({ info, state }))
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

    const allProps = { ...props, href, state: stateRef, onClick: onClickEventHandler }

    return a(allProps as any as Props, ...children)
  })
}
