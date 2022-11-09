import * as Effect from '@effect/core/io/Effect'
import * as T from '@tsplus/stdlib/service/Tag'

export namespace Navigator {
  export const Tag: T.Tag<Navigator> = T.Tag<Navigator>()
  export const provide = (navigator: Navigator) => Effect.provideService(Tag, navigator)
}

export const getNavigator: Effect.Effect<Navigator, never, Navigator> = Effect.service(
  Navigator.Tag,
)
