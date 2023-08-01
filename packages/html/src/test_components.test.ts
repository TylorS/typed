import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { it } from 'vitest'

import { makeElementRef } from './ElementRef.js'
import { EventHandler } from './EventHandler.js'
import { RenderEvent } from './RenderEvent.js'
import { RenderTemplate, html } from './RenderTemplate.js'

export const counter: Fx.Fx<Scope.Scope | RenderTemplate, never, RenderEvent> = Fx.gen(
  function* ($) {
    const count = yield* $(Fx.makeRef(Effect.succeed(0)))
    const increment = count.update((n) => n + 1)
    const decrement = count.update((n) => n - 1)

    return html`
      <button id="decrement" onclick=${decrement}>-</button>
      <span id="count">${count}</span>
      <button id="increment" onclick=${increment}>+</button>
    `
  },
)

export const inputWithLabel = Fx.gen(function* ($) {
  const inputRef = yield* $(makeElementRef<HTMLInputElement>())

  return html`<div class="formgroup">
    <input
      ref=${inputRef}
      ?disabled=${false}
      class="custom-input"
      onchange=${EventHandler(() => Effect.unit)}
    />
    <label class="custom-input-label" for="name">Name</label>
  </div>`
})

export interface CloseIconParams<R> {
  readonly fill: string
  readonly height: number
  readonly width: number
  readonly className?: string
  readonly onClick?: EventHandler<Event, R>
}

export const CloseIcon =
  <H extends (strings: TemplateStringsArray, ...values: any) => any>(html: H) =>
  <R = never>({ fill, height, width, className, onClick }: CloseIconParams<R>) =>
    html`<svg
      tabindex="0"
      class="${`${className} h-${height} w-${width}`}"
      fill="${fill}"
      onclick="${onClick}"
      onkeydown=${EventHandler(
        (ev: KeyboardEvent) => (ev.key === 'Enter' && onClick ? onClick.handler(ev) : Effect.unit),
        onClick?.options,
      )}
      width="${width}px"
      height="${height}px"
      viewBox="0 0 18 18"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <g id="NRW-MVP" stroke="none" stroke-width="1" fill-rule="evenodd">
        <g id="M---Menu-Open" transform="translate(-330.000000, -128.000000)">
          <g id="Add-Admin-Modal" transform="translate(0.000000, 101.000000)">
            <g id="Icon/Close" transform="translate(327.000000, 24.000000)">
              <path
                d="M4.67563989,3.2179372 L4.77350013,3.30435196 L11.9999403,10.5311596 L19.2268999,3.30435196 C19.6325668,2.89868268 20.2902829,2.89868268 20.6959498,3.30435196 C21.0704116,3.67881591 21.0992163,4.26804484 20.7823641,4.67554956 L20.6959498,4.77341037 L13.4687684,11.9999961 L20.6958459,19.2267896 C21.1015129,19.6324589 21.1015129,20.2901788 20.6958459,20.695848 C20.3213841,21.070312 19.7321586,21.0991169 19.3246562,20.7822628 L19.226796,20.695848 L11.9999403,13.4688327 L4.77360401,20.695848 C4.36793708,21.1015173 3.71022102,21.1015173 3.30455408,20.695848 C2.93009229,20.3213841 2.90128754,19.7321552 3.21813982,19.3246504 L3.30455408,19.2267896 L10.5311122,11.9999961 L3.3044502,4.77341037 C2.89878327,4.36774109 2.89878327,3.71002124 3.3044502,3.30435196 C3.64770684,2.96109334 4.17142469,2.90828432 4.57020785,3.1459249 L4.67563989,3.2179372 Z"
                id="ic_close"
              ></path>
            </g>
          </g>
        </g>
      </g>
    </svg>`

it('is great', () => {
  // This is here to keep vitest happy, but it's not actually testing anything.
  // We have this file named with .test to ensure any dependencies it utilizes are considered devDependencies.
})
