import type { Deferred } from '@effect/io/Deferred'
import type { Context } from '@typed/context'
import type { Sink } from '@typed/fx'

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
    readonly context: Context<any>,
    // Where to send events or errors to be handled
    readonly sink: Sink<any, any, TemplateResult>,
    // Used to signal when a template has been completed.
    readonly deferred: Deferred<never, void>,
  ) {}
}
