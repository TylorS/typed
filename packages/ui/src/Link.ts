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
export type LinkProps = Omit<TypedPropertiesMap["a"], keyof URL> & UseLinkParams
/**
 * @since 1.0.0
 */
export function Link<Props extends LinkProps, Children extends ReadonlyArray<Renderable<any, any>> = readonly []>(
  { info, onClick, relative, reloadDocument, replace, state, to, ...props }: Props,
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
    const link = yield* _(useLink({ info, relative, reloadDocument, replace, state, to }))
    const onClickHandler = getEventHandler(onClick)
    const onClickEventHandler = EventHandler.preventDefault(
      (ev: EventWithCurrentTarget<HTMLAnchorElement, MouseEvent>) =>
        Effect.gen(function*(_) {
          if (onClickHandler) {
            yield* _(onClickHandler.handler(ev))
          }
          yield* _(link.navigate)
        }),
      onClickHandler?.options
    )

    const allProps = { ...props, href: link.href, state: link.state, onClick: onClickEventHandler }

    return a(allProps as any as Props, ...children)
  })
}

export type UseLink<Params extends UseLinkParams> = {
  readonly relative: RefSubject.RefSubject<never, Placeholder.Error<Params["relative"]>, boolean>
  readonly replace: RefSubject.RefSubject<never, Placeholder.Error<Params["replace"]>, boolean>
  readonly state: RefSubject.RefSubject<never, Placeholder.Error<Params["state"]>, unknown>
  readonly info: RefSubject.RefSubject<never, Placeholder.Error<Params["info"]>, unknown>
  readonly reloadDocument: RefSubject.RefSubject<never, Placeholder.Error<Params["reloadDocument"]>, boolean>
  readonly href: RefSubject.Computed<
    Navigation.Navigation | CurrentRoute,
    Placeholder.Error<Params["to"] | Params["relative"]>,
    string
  >

  readonly navigate: Effect.Effect<
    Navigation.Navigation | CurrentRoute<string>,
    | Navigation.NavigationError
    | Placeholder.Error<Params["replace"]>
    | Placeholder.Error<Params["state"]>
    | Placeholder.Error<Params["info"]>
    | Placeholder.Error<Params["reloadDocument"]>
    | Placeholder.Error<Params["relative"] | Params["to"]>,
    void
  >
}

export type UseLinkParams = {
  readonly to: string | Placeholder.Any<string>
  readonly relative?: boolean | Placeholder.Any<boolean> | undefined
  readonly replace?: boolean | Placeholder.Any<boolean> | undefined
  readonly state?: object | Placeholder.Any<unknown> | undefined
  readonly info?: object | Placeholder.Any<unknown> | undefined
  readonly reloadDocument?: boolean | Placeholder.Any<boolean> | undefined
}

export function useLink<Params extends UseLinkParams>(
  { info, relative, reloadDocument, replace, state, to }: Params
): Effect.Effect<
  Placeholder.Context<Params[keyof Params]>,
  never,
  [UseLink<Params>] extends [infer R] ? { readonly [K in keyof R]: R[K] } : never
> {
  type Return<T extends keyof UseLink<Params>> = UseLink<Params>[T]

  return Effect.gen(function*(_) {
    const toRef = yield* _(Placeholder.asRef(to))
    const relativeRef: Return<"relative"> = yield* _(Placeholder.asRef(relative ?? true))
    const replaceRef: Return<"replace"> = yield* _(Placeholder.asRef(replace ?? false))
    const stateRef: Return<"state"> = (yield* _(Placeholder.asRef(state))) as any
    const infoRef: Return<"info"> = yield* _(Placeholder.asRef(info)) as any
    const reloadDocumentRef: Return<"reloadDocument"> = yield* _(Placeholder.asRef(reloadDocument ?? false))
    const href: Return<"href"> = RefSubject.mapEffect(
      RefSubject.tuple([relativeRef, toRef]),
      ([rel, to]) => rel ? Effect.orDie(makeHref(to)) : Effect.succeed(to)
    )
    const navigate: Return<"navigate"> = Effect.gen(function*(_) {
      const replace = yield* _(replaceRef)
      const state = yield* _(stateRef)
      const url = yield* _(href)
      const info = yield* _(infoRef)

      yield* _(Navigation.navigate(url, {
        info,
        history: replace ? "replace" : "auto",
        state
      }))

      if (yield* _(reloadDocumentRef)) {
        yield* _(Navigation.reload({ info, state }))
      }
    })

    const useLink: UseLink<Params> = {
      relative: relativeRef,
      replace: replaceRef,
      state: stateRef,
      info: infoRef,
      reloadDocument: reloadDocumentRef,
      href,
      navigate
    }

    return useLink
  }) as any
}
