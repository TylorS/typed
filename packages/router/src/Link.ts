import { not } from '@effect/data/Predicate'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import { getIsUsingKeyModifier } from '@typed/dom'
import * as Fx from '@typed/fx'
import { EventHandler, Placeholder } from '@typed/html'
import * as Navigation from '@typed/navigation'
import { pathJoin } from '@typed/path'

import { Router, getCurrentPathFromUrl } from './router.js'

export interface UseLinkParams<
  To extends Placeholder<any, any, string>,
  Replace extends Placeholder<any, any, boolean>,
  State,
  Relative extends Placeholder<any, any, boolean>,
  Key extends Placeholder<any, any, string>,
> {
  readonly to: To
  readonly replace?: Replace
  readonly state?: State
  readonly relative?: Relative
  readonly key?: Key
}

export namespace UseLinkParams {
  export type Any = UseLinkParams<
    Placeholder<any, any, string>,
    Placeholder<any, any, boolean>,
    unknown,
    Placeholder<any, any, boolean>,
    Placeholder<any, any, string>
  >

  export type Context<T extends Any> =
    | Placeholder.ResourcesOf<T['to']>
    | Placeholder.ResourcesOf<T['replace']>
    | Placeholder.ResourcesOf<T['state']>
    | Placeholder.ResourcesOf<T['relative']>
    | Placeholder.ResourcesOf<T['key']>

  export type Error<T extends Any> =
    | Placeholder.ErrorsOf<T['to']>
    | Placeholder.ErrorsOf<T['replace']>
    | Placeholder.ErrorsOf<T['state']>
    | Placeholder.ErrorsOf<T['relative']>
    | Placeholder.ErrorsOf<T['key']>
}

export interface UseLink<E> {
  readonly url: Fx.Computed<Router, E, string>
  readonly options: Fx.Computed<never, E, Navigation.NavigateOptions>
  readonly navigate: Effect.Effect<Router, E, Navigation.Destination>
  readonly active: Fx.Fx<Router, E, boolean>
  readonly onClick: EventHandler<KeyboardEvent | MouseEvent, Router, E>
}

export namespace UseLink {
  export type FromParams<T extends UseLinkParams.Any> = [UseLink<UseLinkParams.Error<T>>] extends [
    infer U,
  ]
    ? U
    : never
}

export function useLink<Params extends UseLinkParams.Any>(
  params: Params,
): Effect.Effect<UseLinkParams.Context<Params> | Scope.Scope, never, UseLink.FromParams<Params>> {
  return Effect.map(
    Effect.all([
      Placeholder.asRef(params.to),
      Placeholder.asRef(params.replace ?? false),
      Placeholder.asRef(params.state ?? null),
      Placeholder.asRef(params.key),
      Placeholder.asRef(params.relative ?? true),
      Router,
    ] as const),
    ([to, replace, state, key, relative, router]) => {
      const url = Fx.RefSubject.tuple(to, relative).mapEffect(([to, relative]) =>
        Effect.gen(function* ($) {
          let url = to

          // Check if we should make the URL relative to the current route
          if (relative) {
            const { route, params } = router
            const matched = yield* $(params)
            const basePath = route.make(matched)

            url = pathJoin(basePath, url)
          }

          return url
        }),
      )
      const options = Fx.RefSubject.tuple(replace, state, key).map(
        ([replace, state, key]): Navigation.NavigateOptions => ({
          history: replace ? 'replace' : 'push',
          state,
          key: key ?? undefined,
        }),
      )

      const active = Fx.map(Fx.combine(url, router.navigation.currentEntry), ([url, destination]) =>
        isActive(url, destination.url),
      )

      const navigate: Effect.Effect<
        Router,
        UseLinkParams.Error<Params>,
        Navigation.Destination
      > = Effect.flatMap(Effect.all([url, options] as const), ([url, options]) =>
        Router.withEffect((r) => r.navigation.navigate(url, options)),
      )

      const onClick = EventHandler.preventDefault.if<
        KeyboardEvent | MouseEvent,
        Router,
        UseLinkParams.Error<Params>
      >(not(getIsUsingKeyModifier), () => navigate)

      return {
        url,
        options,
        navigate,
        active,
        onClick,
      } satisfies UseLink.FromParams<Params>
    },
  )
}

export function Link<Params extends UseLinkParams.Any, R, E, A>(
  params: Params,
  render: (use: UseLink.FromParams<Params>) => Fx.Fx<R, E, A>,
): Fx.Fx<Scope.Scope | R | UseLinkParams.Context<Params>, E, A> {
  return Fx.fromFxEffect(Effect.map(useLink(params), render))
}

function isActive(url: string, current: URL): boolean {
  const { pathname } = current

  return (
    url === current.href ||
    url === pathname ||
    url === pathname + current.search ||
    url === pathname + current.hash ||
    url === getCurrentPathFromUrl(current)
  )
}
