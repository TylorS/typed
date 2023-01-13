import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import { createElement, Location, querySelector } from '@typed/dom'
import type { Main } from '@typed/framework'
import * as Fx from '@typed/fx'
import type { Route, ParamsOf } from '@typed/route'
import { Router } from '@typed/router'
import type { ComponentConstructorOptions, SvelteComponentTyped } from 'svelte'
import type { SvelteComponentDev } from 'svelte/internal'

let isFirstRender = true

export function renderSvelte<
  R,
  P extends string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Props extends {},
  Events extends Record<string, any>,
  Slots extends Record<string, any>,
  T extends SvelteComponentDev | SvelteComponentTyped<Props, Events, Slots>,
>(
  route: Route<R, P>,
  Component: new (options: ComponentConstructorOptions<Props>) => T,
  f: (params: ParamsOf<typeof route>) => Props,
): Main<never, typeof route> {
  return (params) =>
    Fx.gen(function* ($) {
      const location = yield* $(Location.get)
      const router = yield* $(Router.get)
      const initialParams: Option.Option<ParamsOf<typeof route>> = (yield* $(
        // Route will already be amended here since it has been matched. The function
        // parameter is used merely for type-inference
        router.route.match(location.pathname),
      )) as any

      if (Option.isNone(initialParams)) {
        throw new Error(
          'Bug it should be impossible to run this page without matching the current route',
        )
      }

      if (!import.meta.env.SSR) {
        const current = yield* $(querySelector('#svelte-root'))
        const container = yield* $(
          pipe(
            current,
            Option.match(() => createElement('div'), Effect.succeed),
          ),
        )
        container.id = 'svelte-root'

        const instance = new Component({
          target: container,
          props: f(initialParams.value),
          hydrate: isFirstRender ? Option.isSome(current) : false,
        })

        isFirstRender = false

        return pipe(
          params,
          Fx.map((params) => (instance.$set(f(params)), container)),
          Fx.onInterrupt(() => Effect.sync(() => instance.$destroy())),
        )
      }

      const container = yield* $(createElement('div'))
      container.id = 'svelte-root'

      // TODO: Fix typings
      const { html } = (Component as any).render(f(initialParams.value))

      container.innerHTML = html

      return Fx.succeed(container)
    })
}
