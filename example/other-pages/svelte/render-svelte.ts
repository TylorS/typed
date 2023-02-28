import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import { createElement, getHead } from '@typed/dom'
import * as Fx from '@typed/fx'
import type { Route, ParamsOf } from '@typed/route'
import type { ComponentConstructorOptions, SvelteComponentTyped } from 'svelte'
import type { create_ssr_component, SvelteComponentDev } from 'svelte/internal'

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
  R2,
  E2,
>(
  route: Route<R, E, P>,
  Component: new (options: ComponentConstructorOptions<Props>) => T,
  routeParamsToProps: (params: ParamsOf<typeof route>) => Effect.Effect<R2, E2, Props>,
) {
  return renderThirdParty(
    route,
    'svelte-root',
    (params) =>
      Effect.gen(function* ($) {
        const props = yield* $(routeParamsToProps(params))
        const ssr = Component as unknown as ReturnType<typeof create_ssr_component>
        const { html, css, head } = ssr.render(props)

        // In development we need to insert our css/head content ourselves
        if (import.meta.env.DEV) {
          const headElement = yield* $(getHead)
          const styleElement = yield* $(createElement('style'))

          styleElement.innerText = css.code
          headElement.appendChild(styleElement)
          headElement.append(head)
        }

        return html
      }),
    (container, initialParams, params, shouldHydrate) =>
      Fx.gen(function* ($) {
        const instance = new Component({
          target: container,
          props: yield* $(routeParamsToProps(initialParams)),
          hydrate: shouldHydrate,
        })

        return pipe(
          params,
          Fx.switchMapEffect(routeParamsToProps),
          Fx.map((props) => (instance.$set(props), container)),
          Fx.onInterrupt(() => Effect.sync(() => instance.$destroy())),
        )
      }),
  )
}
