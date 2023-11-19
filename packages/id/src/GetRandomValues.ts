import * as Context from "@typed/context"
import type { Layer } from "effect"
import { Effect, Random } from "effect"

export const GetRandomValues = Context.Fn<(length: number) => Effect.Effect<never, never, Uint8Array>>()(
  (_) => class GetRandomValues extends _("@typed/id/GetRandomValues") {}
)
export type GetRandomValues = Context.Fn.Identifier<typeof GetRandomValues>

export const webCrypto = (crypto: Crypto): Layer.Layer<never, never, GetRandomValues> =>
  GetRandomValues.implement((length) => Effect.sync(() => crypto.getRandomValues(new Uint8Array(length))))

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
export const nodeCrypto = (crypto: typeof import("node:crypto")): Layer.Layer<never, never, GetRandomValues> =>
  GetRandomValues.implement((length) =>
    Effect.sync(() => {
      const bytes = crypto.randomBytes(length)
      const view = new Uint8Array(length)
      for (let i = 0; i < bytes.length; ++i) {
        view[i] = bytes[i]
      }
      return view
    })
  )

export const pseudoRandom: Layer.Layer<never, never, GetRandomValues> = GetRandomValues.implement((length) =>
  Effect.gen(function*(_) {
    const view = new Uint8Array(length)

    for (let i = 0; i < length; ++i) {
      view[i] = yield* _(Random.nextInt)
    }

    return view
  })
)
