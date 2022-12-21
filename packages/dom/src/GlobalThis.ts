import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as T from '@fp-ts/data/Context'
import { Identity } from '@fp-ts/data/Identity'
import * as Fx from '@typed/fx'

import { getBody } from './Document.js'

export interface GlobalThis extends Identity<typeof globalThis> {}

export namespace GlobalThis {
  export const Tag: T.Tag<GlobalThis> = T.Tag<GlobalThis>()

  export const access = Effect.serviceWith(Tag)
  export const accessEffect = Effect.serviceWithEffect(Tag)
  export const accessFx = Fx.serviceWithFx(Tag)

  export const provide = Effect.provideService(Tag)
}

export const getGlobalThis: Effect.Effect<GlobalThis, never, GlobalThis> = Effect.service(
  GlobalThis.Tag,
)

export const makeDOMParser: Effect.Effect<GlobalThis, never, globalThis.DOMParser> =
  GlobalThis.access((globalThis) => new globalThis.DOMParser())

export const liveGlobalThis: Layer.Layer<never, never, GlobalThis> = Layer.fromEffect(
  GlobalThis.Tag,
)(Effect.sync(() => globalThis))

// Declarative shadow-dom polyfill

export const supportsDeclarativeShadowDom = GlobalThis.access((g) =>
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
