// Declarative shadow-dom polyfill
import * as Effect from '@effect/io/Effect'

import { getBody } from './Document.js'
import { GlobalThis } from './GlobalThis.js'

export const supportsDeclarativeShadowDom = GlobalThis.with((g) =>
  // eslint-disable-next-line no-prototype-builtins
  g.HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot'),
)

export const attachShadowRoots: Effect.Effect<GlobalThis | Document, never, void> = Effect.gen(
  function* ($) {
    if (yield* $(supportsDeclarativeShadowDom)) return

    const body = yield* $(getBody)

    attachShadowRoots_(body)
  },
)

function attachShadowRoots_(root: HTMLElement | ShadowRoot) {
  root.querySelectorAll('template[shadowroot]').forEach((template) => {
    const mode = (template.getAttribute('shadowroot') || 'open') as ShadowRootMode
    const shadowRoot = (template.parentNode as HTMLElement).attachShadow({ mode })

    shadowRoot.appendChild((template as HTMLTemplateElement).content)
    template.remove()
    attachShadowRoots_(shadowRoot)
  })
}
