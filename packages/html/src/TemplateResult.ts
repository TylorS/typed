import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as FiberId from '@effect/io/Fiber/Id'
import * as Context from '@typed/context'
import { Sink } from '@typed/fx'

import type { RenderTemplateOptions } from './RenderTemplate.js'
import type { Renderable } from './Renderable.js'

/**
 * The Immutable result of a tagged template function. Used to render a
 * `TemplateResult` to a `Rendered` value.
 *
 * While the `R` and `E` type parameters here are defined as `unknown`, they
 * are all required to be congruent with the `R` and `E` type parameters of
 * one another. These types are captured when utilizing the `html`/`svg` tagged
 * template functions which construct an Fx.
 */
export class TemplateResult {
  constructor(
    // The template strings
    readonly template: TemplateStringsArray,
    // The interpolated values of a template
    readonly values: ReadonlyArray<Renderable<any, any>>,
    // Options for rendering a template
    readonly options: RenderTemplateOptions | undefined,
    // The context in which all Effects will be run
    readonly context: Context.Context<any>,
    // Where to send events or errors to be handled
    readonly sink: Sink<any, any, TemplateResult>,
    // Used to signal when a template has been completed.
    readonly deferred: Deferred.Deferred<never, void>,
  ) {}
}

function tmpl(template: TemplateStringsArray) {
  return {
    template,
  }
}

const { template: emptyTemplate } = tmpl``
const emptyContext = Context.empty() as Context.Context<any>
const emptySink = Sink(
  () => Effect.unit(),
  () => Effect.unit(),
)

/**
 * Utilized to lift values into a `TemplateResult` for use in hydration to
 * help find the right place in the DOM to handle diffing and patching
 * @internal */
export function fromValue(value: unknown) {
  return new TemplateResult(
    emptyTemplate,
    [value as Renderable<any, any>],
    undefined,
    emptyContext,
    emptySink,
    Deferred.unsafeMake(FiberId.none),
  )
}
