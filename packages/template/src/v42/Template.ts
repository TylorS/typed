import type { Cause, Context, Effect, Scope } from "effect"
import type { FiberRefs } from "effect/FiberRefs"
import type { RuntimeFlags } from "effect/RuntimeFlags"
import type { CloseableScope } from "effect/Scope"
import type { Placeholder } from "./Placeholder.js"
import type { RenderContext } from "./RenderContext.js"
import type { RenderQueue } from "./RenderQueue.js"
import type { TemplateEntry } from "./TemplateEntry.js"

export class Template {
  constructor(
    readonly entry: TemplateEntry,
    readonly values: ReadonlyArray<Placeholder.Any>,
    readonly onCause: (cause: Cause.Cause<unknown>) => Effect.Effect<unknown>,
    readonly context: Context.Context<RenderContext | RenderQueue | Scope.Scope>,
    readonly fiberRefs: FiberRefs,
    readonly runtimeFlags: RuntimeFlags,
    readonly scope: CloseableScope
  ) {}
}
