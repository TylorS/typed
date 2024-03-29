import type { Cause, Context, Effect, Scope } from "effect"
import type { FiberRefs } from "effect/FiberRefs"
import type { RuntimeFlags } from "effect/RuntimeFlags"
import type { CloseableScope } from "effect/Scope"
import type { Placeholder } from "./Placeholder.js"
import type { RenderContext } from "./RenderContext.js"
import type { RenderQueue } from "./RenderQueue.js"

export class Template<
  Entry,
  Values extends ReadonlyArray<Placeholder.Any>
> {
  constructor(
    readonly entry: Entry,
    readonly values: Values,
    readonly onCause: (cause: Cause.Cause<unknown>) => Effect.Effect<unknown>,
    readonly context: Context.Context<RenderContext | RenderQueue | Scope.Scope>,
    readonly fiberRefs: FiberRefs,
    readonly runtimeFlags: RuntimeFlags,
    readonly scope: CloseableScope
  ) {}
}

export namespace Template {
  export type Any = Template<any, ReadonlyArray<Placeholder.Any>>
}
