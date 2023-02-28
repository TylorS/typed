import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { createElement, getHead } from '@typed/dom'
import * as Fx from '@typed/fx'
import type { Route, ParamsOf } from '@typed/route'
import type { ComponentConstructorOptions, SvelteComponentTyped } from 'svelte'
import type { SvelteComponentDev } from 'svelte/internal'

import { renderThirdParty } from '../render-third-party.js'

export function renderSvelte<
  R,
  E,
  P extends string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Props extends {},
  Events extends Record<string, any>,
  Slots extends Record<string, any>,
  T extends SvelteComponentDev | SvelteComponentTyped<Props, Events, Slots>,
>(
  route: Route<R, E, P>,
  Component: new (options: ComponentConstructorOptions<Props>) => T,
  routeParamsToProps: (params: ParamsOf<typeof route>) => Props,
) {
  return renderThirdParty(
    route,
    'svelte-root',
    (container, params) =>
      Effect.gen(function* ($) {
        const { html, css, head } = (Component as any).render(routeParamsToProps(params))

        container.innerHTML = html

        // In development we need to insert our css content
        if (import.meta.env.DEV) {
          const headElement = yield* $(getHead)
          const styleElement = yield* $(createElement('style'))

          styleElement.innerText = css.code
          headElement.appendChild(styleElement)
          headElement.append(head)
        }
      }),
    (container, initialParams, params, shouldHydrate) =>
      Fx.suspend(() => {
        const instance = new Component({
          target: container,
          props: routeParamsToProps(initialParams),
          hydrate: shouldHydrate,
        })

        return pipe(
          params,
          Fx.map((params) => (instance.$set(routeParamsToProps(params)), container)),
          Fx.onInterrupt(() => Effect.sync(() => instance.$destroy())),
        )
      }),
  )
}
