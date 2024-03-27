import * as Context from "@typed/context"
import type { Runtime } from "effect"
import { Effect } from "effect"
import type { Scope } from "effect/Scope"
import type { Parser } from "./Parser.js"
import type { Part, PartGroup } from "./Part.js"
import type { Placeholder } from "./Placeholder.js"
import { RenderContext } from "./RenderContext.js"
import type { RenderQueue } from "./RenderQueue.js"
import { Template } from "./Template.js"

export interface RenderTemplate<
  T,
  Parts extends ReadonlyArray<Part<any> | PartGroup.Any>,
  Values extends ReadonlyArray<Placeholder.Any>
> {
  <V extends Values>(
    string: TemplateStringsArray,
    ...values: V
  ): Effect.Effect<
    Template<T, Parts, V, Placeholder.Context<Values[number]>>,
    never,
    Placeholder.Context<Values[number]> | RenderContext | RenderQueue | Scope
  >
}

export function make<
  T,
  Parts extends ReadonlyArray<Part<any> | PartGroup.Any>,
  Values extends ReadonlyArray<Placeholder.Any>
>(
  parser: Parser<T>,
  buildParts: (template: T) => Parts
): RenderTemplate<T, Parts, Values> {
  type R = RenderQueue | Scope | RenderContext | Placeholder.Context<Values[number]>

  return <V extends Values>(strings: TemplateStringsArray, ...values: V): Effect.Effect<
    Template<T, Parts, V, Placeholder.Context<Values[number]>>,
    never,
    R
  > =>
    Effect.gen(function*(_) {
      const runtime: Runtime.Runtime<R> = yield* _(Effect.runtime<R>())
      const renderContext: RenderContext = Context.unsafeGet(runtime.context, RenderContext)
      const template: T = parser(strings, renderContext)

      return new Template<T, Parts, V, R>(template, buildParts(template), values, runtime)
    })
}
