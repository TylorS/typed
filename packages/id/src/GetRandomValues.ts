/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Effect from "effect/Effect"
import type * as Layer from "effect/Layer"
import * as Random from "effect/Random"

/**
 * @since 1.0.0
 */
export const GetRandomValues = Context.Fn<(length: number) => Effect.Effect<Uint8Array>>()(
  (_) => (class GetRandomValues extends _("@typed/id/GetRandomValues") {})
)
/**
 * @since 1.0.0
 */
export interface GetRandomValues extends Context.Fn.Identifier<typeof GetRandomValues> {}

const getRandomValuesWeb = (crypto: Crypto, length: number) => crypto.getRandomValues(new Uint8Array(length))

/**
 * @since 1.0.0
 */
export const webCrypto = (crypto: Crypto): Layer.Layer<GetRandomValues> =>
  GetRandomValues.implement((length) => Effect.sync(() => getRandomValuesWeb(crypto, length)))

/**
 * @since 1.0.0
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const getRandomValuesNode = (crypto: typeof import("node:crypto"), length: number) => {
  const bytes = crypto.randomBytes(length)
  const view = new Uint8Array(length)
  for (let i = 0; i < bytes.length; ++i) {
    view[i] = bytes[i]
  }
  return view
}

/**
 * @since 1.0.0
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const nodeCrypto = (crypto: typeof import("node:crypto")): Layer.Layer<GetRandomValues> =>
  GetRandomValues.implement((length) => Effect.sync(() => getRandomValuesNode(crypto, length)))

/**
 * @since 1.0.0
 */
export const pseudoRandom: Layer.Layer<GetRandomValues> = GetRandomValues.implement((length) =>
  Effect.gen(function*() {
    const view = new Uint8Array(length)

    for (let i = 0; i < length; ++i) {
      view[i] = yield* Random.nextInt
    }

    return view
  })
)

/**
 * @since 1.0.0
 */
export const getRandomValues: Layer.Layer<GetRandomValues> = GetRandomValues.layer(
  Effect.gen(function*() {
    if (typeof crypto === "undefined") {
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      const crypto: typeof import("node:crypto") = yield* Effect.promise(() => import("node:crypto"))

      return (length: number) => Effect.sync(() => getRandomValuesNode(crypto, length))
    } else {
      return (length: number) => Effect.sync(() => getRandomValuesWeb(crypto, length))
    }
  })
)
