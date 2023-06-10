import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { Placeholder } from '@typed/html'
import * as Navigation from '@typed/navigation'
import { pathJoin } from '@typed/path'

import { Router, getCurrentPathFromUrl } from './router.js'

export interface UseLinkParams<
  R = never,
  E = never,
  R2 = never,
  E2 = never,
  R3 = never,
  E3 = never,
  R4 = never,
  E4 = never,
  R5 = never,
  E5 = never,
> {
  readonly to: Placeholder<R, E, string>
  readonly replace?: Placeholder<R2, E2, boolean>
  readonly state?: Placeholder<R3, E3, unknown> | unknown
  readonly relative?: Placeholder<R4, E4, boolean>
  readonly key?: Placeholder<R5, E5, string>
}

export namespace UseLinkParams {
  export type Any = UseLinkParams<any, any, any, any, any, any, any, any, any, any>

  export type Context<T extends Any> = Placeholder.ResourcesOf<
    T['to'] | T['replace'] | T['state'] | T['relative'] | T['key']
  >

  export type Error<T extends Any> = Placeholder.ErrorsOf<
    T['to'] | T['replace'] | T['state'] | T['relative'] | T['key']
  >
}

export interface UseLink<E> {
  readonly url: Fx.Computed<Router, E, string>
  readonly options: Fx.Computed<never, E, Navigation.NavigateOptions>
  readonly navigate: Effect.Effect<Router | Navigation.Navigation, E, Navigation.Destination>
  readonly active: Fx.Computed<Router | Navigation.Navigation, E, boolean>
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
  return Effect.gen(function* ($) {
    const [to, replace, state, key, relative] = yield* $(
      Effect.allPar(
        Placeholder.asRef(params.to),
        Placeholder.asRef(params.replace ?? false),
        Placeholder.asRef(params.state ?? null),
        Placeholder.asRef(params.key),
        Placeholder.asRef(params.relative ?? true),
      ),
    )

    const url = Fx.RefSubject.tuple(to, relative).mapEffect(([to, relative]) =>
      Effect.gen(function* ($) {
        let url = to

        // Check if we should make the URL relative to the current route
        if (relative) {
          const { route, params } = yield* $(Router)
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
        key,
      }),
    )

    const active: Fx.Computed<
      Router | Navigation.Navigation,
      UseLinkParams.Error<Params>,
      boolean
    > = url.mapEffect((url) =>
      Effect.gen(function* ($) {
        const { currentEntry } = yield* $(Navigation.Navigation)
        const current = (yield* $(currentEntry)).url

        return isActive(url, current)
      }),
    )

    const navigate: Effect.Effect<
      Router | Navigation.Navigation,
      UseLinkParams.Error<Params>,
      Navigation.Destination
    > = Effect.flatMap(Effect.all(url, options), ([url, options]) =>
      Navigation.navigate(url, options),
    )

    return {
      url,
      options,
      navigate,
      active,
    } satisfies UseLink.FromParams<Params>
  })
}

export function Link<Params extends UseLinkParams.Any, R, E, A>(
  params: Params,
  render: (use: UseLink.FromParams<Params>) => Fx.Fx<R, E, A>,
): Fx.Fx<Scope.Scope | R | UseLinkParams.Context<Params>, E, A> {
  return Fx.fromFxEffect(Effect.map(useLink(params), render))
}

function isActive(url: string, current: URL): boolean {
  return (
    url === current.href ||
    url === current.pathname ||
    url === current.pathname + current.search ||
    url === getCurrentPathFromUrl(current)
  )
}
