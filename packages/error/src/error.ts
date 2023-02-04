import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

export const tagged = <Tag extends string>(tag: Tag) =>
  class TaggedError extends Error implements Tagged<Tag> {
    static tag = tag
    readonly _tag = tag

    static catch<T extends TaggedConstructor<Tag>, R, E, A>(
      this: T,
      f: (error: InstanceType<T>) => Effect.Effect<R, E, A>,
    ): <R2, E2, A2>(
      effect: Effect.Effect<R2, E2 | InstanceType<T>, A2>,
    ) => Effect.Effect<R | R2, E | Exclude<E2, InstanceType<T>>, A | A2> {
      return Effect.catchTag(tag, f as any) as any
    }

    static catchFx<T extends TaggedConstructor<Tag>, R, E, A>(
      this: T,
      f: (error: InstanceType<T>) => Fx.Fx<R, E, A>,
    ): <R2, E2, A2>(
      fx: Fx.Fx<R2, E2 | InstanceType<T>, A2>,
    ) => Fx.Fx<R | R2, E | Exclude<E2, InstanceType<T>>, A | A2> {
      return Fx.catchTag(tag, f as any) as any
    }

    static switchMapCatch<T extends TaggedConstructor<Tag>, R, E, A>(
      this: T,
      f: (error: InstanceType<T>) => Fx.Fx<R, E, A>,
    ): <R2, E2, A2>(
      fx: Fx.Fx<R2, E2 | InstanceType<T>, A2>,
    ) => Fx.Fx<R | R2, E | Exclude<E2, InstanceType<T>>, A | A2> {
      return Fx.switchMapCatchTag(tag, f as any) as any
    }

    readonly is = <T extends TaggedConstructor<any>>(constructor: T): this is InstanceType<T> =>
      this._tag === constructor.tag
  }

export type TaggedConstructor<Tag extends string> = {
  readonly tag: Tag
  new (...args: any[]): Tagged<Tag>

  readonly catch: ReturnType<typeof tagged<Tag>>['catch']
  readonly catchFx: ReturnType<typeof tagged<Tag>>['catchFx']
  readonly switchMapCatch: ReturnType<typeof tagged<Tag>>['switchMapCatch']
}

export interface Tagged<Tag extends string> extends Error {
  readonly _tag: Tag
  readonly is: <T extends TaggedConstructor<any>>(constructor: T) => this is InstanceType<T>
}

export type TagOf<T> = [T] extends [Tagged<infer Tag>]
  ? Tag
  : [T] extends [TaggedConstructor<infer Tag>]
  ? Tag
  : never
