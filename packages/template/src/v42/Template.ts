import type { Runtime, Scope } from "effect"
import type { Part, PartGroup } from "./Part.js"
import type { Placeholder } from "./Placeholder.js"
import type { RenderContext } from "./RenderContext.js"
import type { RenderQueue } from "./RenderQueue.js"

export class Template<
  in out T,
  out Parts extends ReadonlyArray<Part<any> | PartGroup<any, any>>,
  out Values extends ReadonlyArray<Placeholder.Any>,
  in R
> {
  constructor(
    readonly template: T,
    readonly parts: Parts,
    readonly values: Values,
    readonly runtime: Runtime.Runtime<R | RenderContext | RenderQueue | Scope.Scope>
  ) {}
}

export namespace Template {
  export type Any = Template<
    any,
    ReadonlyArray<Part<any> | PartGroup<any, any>>,
    ReadonlyArray<Placeholder.Any>,
    any
  >
}
