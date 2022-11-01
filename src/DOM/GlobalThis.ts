import * as Effect from '@effect/core/io/Effect'
import * as Layer from '@effect/core/io/Layer'
import * as T from '@tsplus/stdlib/service/Tag'

export type GlobalThis = typeof globalThis

export namespace GlobalThis {
  export const Tag: T.Tag<GlobalThis> = T.Tag<GlobalThis>()
}

export const getGlobalThis: Effect.Effect<GlobalThis, never, GlobalThis> = Effect.service(
  GlobalThis.Tag,
)

export const makeDOMParser: Effect.Effect<GlobalThis, never, globalThis.DOMParser> =
  Effect.serviceWith(GlobalThis.Tag, (globalThis) => new globalThis.DOMParser())

export const liveGlobalThis: Layer.Layer<never, never, GlobalThis> = Layer.fromEffect(
  GlobalThis.Tag,
)(Effect.sync(() => globalThis))
