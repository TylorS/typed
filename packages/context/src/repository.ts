import * as Layer from "@effect/io/Layer"

import type { EffectFn } from "./EffectFn"
import type { Fn } from "./Fn"
import { struct, type TaggedStruct } from "./Many"

type AnyFns = Readonly<Record<string, Fn.Any>>

export function repository<Fns extends AnyFns>(input: Fns): Repository<Fns> {
  const entries = Object.entries(input)

  const fns = Object.fromEntries(entries.map(([k, v]) => [k, v.apply])) as RepositoryFns<Fns>

  const implement: RepositoryImplement<Fns>["implement"] = ((implementations) => {
    const [first, ...rest] = entries.map(([key, fn]) => fn.implement(implementations[key]))

    return Layer.mergeAll(first, ...rest)
  }) as RepositoryImplement<Fns>["implement"]

  return {
    ...fns,
    ...struct(input),
    implement,
    functions: input
  }
}

export type Repository<Fns extends AnyFns> =
  & RepositoryFns<Fns>
  & TaggedStruct<Fns>
  & RepositoryImplement<Fns>
  & {
    readonly functions: Fns
  }

export type RepositoryFns<Fns extends AnyFns> = {
  readonly [K in keyof Fns]: Fns[K]["apply"]
}

export type RepositoryImplement<Fns extends AnyFns> = {
  readonly implement: <
    Impls extends { readonly [K in keyof Fns]: EffectFn.Extendable<Fn.FnOf<Fns[K]>> }
  >(
    implementations: Impls
  ) => Layer.Layer<EffectFn.ResourcesOf<Impls[keyof Impls]>, never, Fn.KeyOf<Fns[keyof Fns]>>
}
