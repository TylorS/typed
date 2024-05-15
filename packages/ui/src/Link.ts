/**
 * @since 1.0.0
 */
import type { EventWithCurrentTarget } from "@typed/dom/EventTarget"
import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Navigation from "@typed/navigation"
import * as Route from "@typed/route"
import type { CurrentRoute } from "@typed/router"
import { makeHref } from "@typed/router"
import * as EventHandler from "@typed/template/EventHandler"
import { Placeholder } from "@typed/template/Placeholder"
import type { Renderable } from "@typed/template/Renderable"
import type { RenderEvent } from "@typed/template/RenderEvent"
import type { RenderQueue } from "@typed/template/RenderQueue.js"
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
  input: Props,
  ...children: Children
): Fx.Fx<
  RenderEvent,
  Placeholder.Error<Props[keyof Props] | Children[number]>,
  | Navigation.Navigation
  | CurrentRoute
  | RenderTemplate
  | RenderQueue
  | Scope.Scope
  | Placeholder.Context<Props[keyof Props] | Children[number]>
> {
  return Fx.gen(function*(_) {
    const { info, onClick, relative, reloadDocument, replace, state, to, ...linkProps } = input
    const onClickHandler = getEventHandler(onClick)
    const toRef = yield* _(Placeholder.asRef(to))
    const relativeRef = yield* Placeholder.asRef(relative ?? true)
    const replaceRef = yield* Placeholder.asRef(replace ?? false)
    const stateRef = yield* Placeholder.asRef(state)
    const infoRef = yield* Placeholder.asRef(info)
    const reloadDocumentRef = yield* Placeholder.asRef(reloadDocument ?? false)
    const href = RefSubject.mapEffect(
      RefSubject.tuple([relativeRef, toRef]),
      ([rel, to]) => rel ? makeHref(Route.parse<string>(to)) : Effect.succeed(to)
    )
    const navigate = Effect.gen(function*() {
      const replace = yield* replaceRef
      const state = yield* stateRef
      const url = yield* href
      const info = yield* infoRef

      yield* Navigation.navigate(url, {
        info,
        history: replace ? "replace" : "auto",
        state
      })

      if (yield* reloadDocumentRef) {
        yield* Navigation.reload({ info, state })
      }
    })

    const onClickEventHandler = EventHandler.preventDefault(
      (ev: EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>) =>
        Effect.gen(function*() {
          if (onClickHandler) {
            yield* onClickHandler.handler(ev)
          }
          yield* navigate
        }),
      onClickHandler?.options
    )

    const allProps = { ...linkProps, href, onclick: onClickEventHandler } as any

    if ("state" in input) {
      allProps.state = stateRef
    }

    return a(allProps as Props, ...children)
  })
}
