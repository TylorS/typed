import type { Cause } from "effect"
import { Context, Effect, ExecutionStrategy, Scope } from "effect"
import { constant } from "effect/Function"
import type { Placeholder } from "./Placeholder.js"
import type { RenderContext } from "./RenderContext.js"
import type { RenderQueue } from "./RenderQueue.js"
import { Template } from "./Template.js"

export interface ParseTemplate<
  T,
  Values extends ReadonlyArray<Placeholder.Any>
> {
  <const V extends Values>(
    string: TemplateStringsArray,
    values: V,
    onCause: (cause: Cause.Cause<Placeholder.Error<V[number]>>) => Effect.Effect<unknown>
  ): Effect.Effect<
    Template<T, V>,
    never,
    Placeholder.Context<V[number]> | RenderContext | RenderQueue | Scope.Scope
  >
}

const getTemplateData = Effect.context<never>().pipe(
  Effect.bindTo("context"),
  Effect.bind("fiberRefs", () => Effect.getFiberRefs),
  Effect.bind("runtimeFlags", () => Effect.getRuntimeFlags),
  Effect.bind("scope", constant(Effect.flatMap(Effect.scope, (s) => Scope.fork(s, ExecutionStrategy.sequential))))
)

export function make<
  T,
  Values extends ReadonlyArray<Placeholder.Any>
>(
  parse: (template: ReadonlyArray<string>, ctx: Context.Context<RenderContext | RenderQueue | Scope.Scope>) => T
): ParseTemplate<T, Values> {
  return <const V extends Values>(
    strings: TemplateStringsArray,
    values: V,
    onCause: (cause: Cause.Cause<Placeholder.Error<V[number]>>) => Effect.Effect<unknown>
  ): Effect.Effect<
    Template<T, V>,
    never,
    Placeholder.Context<V[number]> | RenderContext | RenderQueue | Scope.Scope
  > => {
    type R = RenderQueue | Scope.Scope | RenderContext | Placeholder.Context<V[number]>
    return Effect.flatMap(
      getTemplateData,
      ({ context, fiberRefs, runtimeFlags, scope }) =>
        Effect.succeed(
          new Template<T, V>(
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
