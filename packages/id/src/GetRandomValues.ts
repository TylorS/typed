/**
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import type { Layer } from "effect"
import { Effect, Random } from "effect"

/**
 * @since 1.0.0
 */
export const GetRandomValues = Context.Fn<(length: number) => Effect.Effect<never, never, Uint8Array>>()(
  (_) => class GetRandomValues extends _("@typed/id/GetRandomValues") {}
)
/**
 * @since 1.0.0
 */
export type GetRandomValues = Context.Fn.Identifier<typeof GetRandomValues>

const getRandomValuesWeb = (crypto: Crypto, length: number) => crypto.getRandomValues(new Uint8Array(length))

/**
 * @since 1.0.0
 */
export const webCrypto = (crypto: Crypto): Layer.Layer<never, never, GetRandomValues> =>
  GetRandomValues.implement((length) => Effect.sync(() => getRandomValuesWeb(crypto, length)))

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const getRandomValuesNode = (crypto: typeof import("node:crypto"), length: number) => {
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
export const nodeCrypto = (crypto: typeof import("node:crypto")): Layer.Layer<never, never, GetRandomValues> =>
  GetRandomValues.implement((length) => Effect.sync(() => getRandomValuesNode(crypto, length)))

/**
 * @since 1.0.0
 */
export const pseudoRandom: Layer.Layer<never, never, GetRandomValues> = GetRandomValues.implement((length) =>
  Effect.gen(function*(_) {
    const view = new Uint8Array(length)

    for (let i = 0; i < length; ++i) {
      view[i] = yield* _(Random.nextInt)
    }

    return view
  })
)

/**
 * @since 1.0.0
 */
export const getRandomValues: Layer.Layer<never, never, GetRandomValues> = GetRandomValues.layer(
  Effect.gen(function*(_) {
    if (typeof crypto === "undefined") {
      const crypto = yield* _(Effect.promise(() => import("node:crypto")))

      return (length: number) => Effect.sync(() => getRandomValuesNode(crypto, length))
    } else {
      return (length: number) => Effect.sync(() => getRandomValuesWeb(crypto, length))
    }
  })
)
