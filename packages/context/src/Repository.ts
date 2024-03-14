/**
 * A Repository is a collection of Context.Fns that can be implemented
 * and utilized in a single place.
 *
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Scope } from "effect/Scope"
import { ContextBuilder } from "./Builder.js"

import type { EffectFn } from "./EffectFn.js"
import type { Fn } from "./Fn.js"
import { struct, type TaggedStruct } from "./Many.js"

type AnyFns = Readonly<Record<string, Fn.Any>>

/**
 * Create a Repository from a collection of Fns.
 * @since 1.0.0
 * @category constructors
 */
export function repository<Fns extends AnyFns>(fns: Fns): Repository<Fns> {
  const entries = Object.entries(fns)

  const implement: RepositoryImplement<Fns>["implement"] = ((implementations) => {
    const [first, ...rest] = entries.map(([key, fn]) => fn.implement(implementations[key]))

    return Layer.mergeAll(first, ...rest)
  }) as RepositoryImplement<Fns>["implement"]

  const makeLayer: RepositoryImplement<Fns>["makeLayer"] = ((effect) =>
    Layer.scopedContext(Effect.gen(function*($) {
      const scope = yield* $(Effect.scope)
      const impls = yield* $(effect)

      let builder = ContextBuilder.empty

      for (const [k, fn] of entries) {
        builder = builder.mergeContext(
          yield* $(Layer.buildWithScope(
            fn.implement(impls[k]),
            scope
          ))
        )
      }

      return builder.context
    }))) as RepositoryImplement<Fns>["makeLayer"]

  return Object.assign(struct(fns), {
    ...fns,
    implement,
    makeLayer
  })
}

/**
 * A Repository is a collection of Context.Fns that can be implemented
 * and utilized in a single place.
 * @since 1.0.0
 * @category models
 */
export type Repository<Fns extends AnyFns> =
  & Fns
  & TaggedStruct<Fns>
  & RepositoryImplement<Fns>

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
  ) => Layer.Layer<Fn.Identifier<Fns[keyof Fns]>, never, EffectFn.Context<Impls[keyof Impls]>>

  readonly makeLayer: <
    R,
    E,
    Impls extends { readonly [K in keyof Fns]: EffectFn.Extendable<Fn.FnOf<Fns[K]>> }
  >(
    implementations: Effect.Effect<Impls, E, R>
  ) => Layer.Layer<Fn.Identifier<Fns[keyof Fns]>, never, Exclude<EffectFn.Context<Impls[keyof Impls]>, Scope>>
}
