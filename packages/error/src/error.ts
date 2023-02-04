import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

export const tagged = <Tag extends string>(tag: Tag) =>
  class TaggedError extends Error implements Tagged<Tag> {
    static tag = tag
    readonly _tag = tag

    static catch = <T extends Tagged<Tag>, R, E, A>(f: (error: T) => Effect.Effect<R, E, A>) =>
      Effect.catchTag(tag, f)

    static catchFx = <T extends Tagged<Tag>, R, E, A>(f: (error: T) => Fx.Fx<R, E, A>) =>
      Fx.catchTag(tag, f)

    static switchMapCatch = <T extends Tagged<Tag>, R, E, A>(f: (error: T) => Fx.Fx<R, E, A>) =>
      Fx.switchMapCatchTag(tag, f)
  }

export type TaggedConstructor<Tag extends string> = ReturnType<typeof tagged<Tag>>

export interface Tagged<Tag extends string> extends Error {
  readonly _tag: Tag
}

export type TagOf<T> = [T] extends [Tagged<infer Tag>]
  ? Tag
  : [T] extends [TaggedConstructor<infer Tag>]
  ? Tag
  : never
