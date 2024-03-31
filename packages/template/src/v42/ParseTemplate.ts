import * as Context from "@typed/context"
import { CurrentEnvironment } from "@typed/environment"
import * as Fx from "@typed/fx"
import type { TemplateEntry } from "@typed/template/v42/TemplateEntry.js"
import type { Cause } from "effect"
import { Effect, ExecutionStrategy, Scope } from "effect"
import { constant } from "effect/Function"
import type { Placeholder } from "./Placeholder.js"
import type { RenderContext } from "./RenderContext.js"
import type { RenderQueue } from "./RenderQueue.js"
import { Template } from "./Template.js"


export const ParseTemplate = Context.Fn<<const V extends ReadonlyArray<Placeholder.Any>>(
    strings: TemplateStringsArray,
    values: V,
    onCause: (cause: Cause.Cause<Placeholder.Error<V[number]>>) => Effect.Effect<unknown>
  ) =>  Effect.Effect<
    Template,
    never,
    Placeholder.Context<V[number]> | RenderContext | RenderQueue | Scope.Scope
  >>()(_ => class ParseTemplate extends _("@typed/template/ParseTemplate") { })
  
export type ParseTemplate = Context.Fn.Identifier<typeof ParseTemplate>

const getTemplateData = Effect.context<never>().pipe(
  Effect.bindTo("context"),
  Effect.bind("fiberRefs", () => Effect.getFiberRefs),
  Effect.bind("runtimeFlags", () => Effect.getRuntimeFlags),
  Effect.bind("scope", constant(Effect.flatMap(Effect.scope, (s) => Scope.fork(s, ExecutionStrategy.sequential))))
)

export function make(
  parse: (
    template: ReadonlyArray<string>,
    ctx: Context.Context<RenderContext | RenderQueue | Scope.Scope>
  ) => TemplateEntry
): Context.Fn.FnOf<typeof ParseTemplate> {
  return <const V extends ReadonlyArray<Placeholder.Any>>(
    strings: TemplateStringsArray,
    values: V,
    onCause: (cause: Cause.Cause<Placeholder.Error<V[number]>>) => Effect.Effect<unknown>
  ): Effect.Effect<
    Template,
    never,
    Placeholder.Context<V[number]> | RenderContext | RenderQueue | Scope.Scope
  > => {
    type R = RenderQueue | Scope.Scope | RenderContext | Placeholder.Context<V[number]>
    return Effect.flatMap(
      getTemplateData,
      ({ context, fiberRefs, runtimeFlags, scope }) =>
        Effect.succeed(
          new Template(
            parse(strings, context as Context.Context<R>),
            values,
            onCause as any,
            Context.add(context, Scope.Scope, scope) as Context.Context<R>,
            fiberRefs,
            runtimeFlags,
            scope
          )
        )
    )
  }
}

export function html<
  Values extends ReadonlyArray<Placeholder.Any>
>(
  strings: TemplateStringsArray,
  ...values: Values
) {
  return Fx.make<
    Template,
    Placeholder.Error<Values[number]>,
    Placeholder.Context<Values[number]> | CurrentEnvironment | ParseTemplate | RenderQueue | RenderContext | Scope.Scope
  >(
    (sink) =>
      CurrentEnvironment.withEffect((env) =>
        env === "dom" || env === "test:dom"
          ? Effect.zipLeft(ParseTemplate(strings, values, sink.onFailure), Effect.never)
          : ParseTemplate(strings, values, sink.onFailure)
      )
  )
}
