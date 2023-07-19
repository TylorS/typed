import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'

export const tagged = <Tag extends string>(tag: Tag) =>
  class TaggedError extends Error implements Tagged<Tag> {
    static _tag = tag
    readonly _tag = tag

    static fail<T extends TaggedConstructor<Tag>>(this: T, ...params: ConstructorParameters<T>) {
      return Effect.fail(new this(...params))
    }

    static failFx<T extends TaggedConstructor<Tag>>(this: T, ...params: ConstructorParameters<T>) {
      return Fx.fail(new this(...params))
    }

    static catch<T extends TaggedConstructor<Tag>, R, E, A>(
      this: T,
      f: (error: InstanceType<T>) => Effect.Effect<R, E, A>,
    ): <R2, E2, A2>(
      effect: Effect.Effect<R2, E2 | InstanceType<T>, A2>,
    ) => Effect.Effect<R | R2, E | Exclude<E2, InstanceType<T>>, A | A2> {
      return Effect.catchTag(tag, f as any) as any
    }

    static catchAll<T extends TaggedConstructor<Tag>, R, E, A>(
      this: T,
      f: (error: InstanceType<T>) => Fx.Fx<R, E, A>,
    ) {
      return <R2, E2, A2>(
        fx: Fx.Fx<R2, E2 | InstanceType<T>, A2>,
      ): Fx.Fx<R | R2, E | Exclude<E2, InstanceType<T>>, A | A2> => {
        return Fx.catchAll(fx, (e) =>
          e instanceof TaggedError ? f(e as InstanceType<T>) : Fx.fail(e as any),
        )
      }
    }

    static switchCatch<T extends TaggedConstructor<Tag>, R, E, A>(
      this: T,
      f: (error: InstanceType<T>) => Fx.Fx<R, E, A>,
    ) {
      return <R2, E2, A2>(
        fx: Fx.Fx<R2, E2 | InstanceType<T>, A2>,
      ): Fx.Fx<R | R2, E | Exclude<E2, InstanceType<T>>, A | A2> => {
        return Fx.switchMapError(fx, (e) =>
          e instanceof TaggedError ? f(e as InstanceType<T>) : Fx.fail(e as any),
        )
      }
    }

    static switchMatch<T extends TaggedConstructor<Tag>, I, R, E, A, R2, E2, B>(
      this: T,
      f: (error: InstanceType<T>) => Fx.Fx<R, E, A>,
      g: (i: I) => Fx.Fx<R2, E2, B>,
    ) {
      return <R3, E3>(
        fx: Fx.Fx<R3, E3 | InstanceType<T>, I>,
      ): Fx.Fx<R | R2 | R3, E | E2 | Exclude<E3, InstanceType<T>>, A | B> => {
        return Fx.switchMatch(
          fx,
          (e) => (e instanceof TaggedError ? f(e as InstanceType<T>) : Fx.fail(e as any)),
          g,
        )
      }
    }

    readonly is = <T extends TaggedConstructor<any>>(constructor: T): this is InstanceType<T> =>
      this._tag === constructor._tag
  }

export type TaggedConstructor<Tag extends string> = {
  readonly _tag: Tag
  new (...args: any[]): Tagged<Tag>

  readonly fail: ReturnType<typeof tagged<Tag>>['fail']
  readonly failFx: ReturnType<typeof tagged<Tag>>['failFx']
  readonly catch: ReturnType<typeof tagged<Tag>>['catch']
  readonly catchAll: ReturnType<typeof tagged<Tag>>['catchAll']
  readonly switchCatch: ReturnType<typeof tagged<Tag>>['switchCatch']
  readonly switchMatch: ReturnType<typeof tagged<Tag>>['switchMatch']
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
