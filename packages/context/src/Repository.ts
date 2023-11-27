/**
 * A Repository is a collection of Context.Fns that can be implemented
 * and utilized in a single place.
 *
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Scope } from "effect/Scope"
import { ContextBuilder } from "./Builder"

import type { EffectFn } from "./EffectFn"
import type { Fn } from "./Fn"
import { struct, type TaggedStruct } from "./Many"

type AnyFns = Readonly<Record<string, Fn.Any>>

/**
 * Create a Repository from a collection of Fns.
 * @since 1.0.0
 * @category constructors
 */
export function repository<Fns extends AnyFns>(input: Fns): Repository<Fns> {
  const entries = Object.entries(input)

  const fns = Object.fromEntries(entries.map(([k, v]) => [k, v.apply])) as RepositoryFns<Fns>

  const implement: RepositoryImplement<Fns>["implement"] = ((implementations) => {
    const [first, ...rest] = entries.map(([key, fn]) => fn.implement(implementations[key]))

    return Layer.mergeAll(first, ...rest)
  }) as RepositoryImplement<Fns>["implement"]

  const make: RepositoryMake<Fns>["make"] = ((effect) =>
    Layer.scopedContext(Effect.gen(function*($) {
      const scope = yield* $(Effect.scope)
      const impls = yield* $(effect)

      let context = ContextBuilder.empty

      for (const [k, fn] of Object.entries(input)) {
        context = context.mergeContext(
          yield* $(Layer.buildWithScope(
            fn.implement(impls[k]),
            scope
          ))
        )
      }

      return context.context
    }))) as RepositoryMake<Fns>["make"]

  return {
    ...fns,
    ...struct(input),
    implement,
    make,
    functions: input
  }
}

/**
 * A Repository is a collection of Context.Fns that can be implemented
 * and utilized in a single place.
 * @since 1.0.0
 * @category models
 */
export type Repository<Fns extends AnyFns> =
  & RepositoryFns<Fns>
  & TaggedStruct<Fns>
  & RepositoryImplement<Fns>
  & RepositoryMake<Fns>
  & {
    readonly functions: Fns
  }

/**
 * Constructs a record of methods from a collection of Fns.
 * @since 1.0.0
 * @category models
 */
export type RepositoryFns<Fns extends AnyFns> = {
  readonly [K in keyof Fns]: Fns[K]["apply"]
}

/**
 * A Repository can be implemented with a collection of Fns.
 * @since 1.0.0
 * @category models
 */
export type RepositoryImplement<Fns extends AnyFns> = {
  readonly implement: <
    Impls extends { readonly [K in keyof Fns]: EffectFn.Extendable<Fn.FnOf<Fns[K]>> }
  >(
    implementations: Impls
  ) => Layer.Layer<EffectFn.Context<Impls[keyof Impls]>, never, Fn.Identifier<Fns[keyof Fns]>>
}

/**
 * A Repository can be implemented with a collection of Fns.
 * @since 1.0.0
 * @category models
 */
export type RepositoryMake<Fns extends AnyFns> = {
  readonly make: <
    R,
    E,
    Impls extends { readonly [K in keyof Fns]: EffectFn.Extendable<Fn.FnOf<Fns[K]>> }
  >(
    implementations: Effect.Effect<R, E, Impls>
  ) => Layer.Layer<Exclude<EffectFn.Context<Impls[keyof Impls]>, Scope>, never, Fn.Identifier<Fns[keyof Fns]>>
}
