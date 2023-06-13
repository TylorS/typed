import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import { Tag } from '@typed/context'
import * as Fx from '@typed/fx'

import type { Placeholder } from './Placeholder.js'
import { Renderable } from './Renderable.js'
import { TemplateResult } from './TemplateResult.js'

export interface RenderTemplate {
  readonly renderTemplate: <const Values extends ReadonlyArray<Renderable<any, any>>>(
    template: TemplateStringsArray,
    values: Values,
    options?: RenderTemplateOptions,
  ) => Fx.Fx<
    Placeholder.ResourcesOf<Values[number]>,
    Placeholder.ErrorsOf<Values[number]>,
    TemplateResult
  >
}

export interface RenderTemplateOptions {
  readonly isSvg?: boolean
}

export const RenderTemplate = Tag<RenderTemplate>('RenderTemplate')

export function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<
  RenderTemplate | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  TemplateResult
> {
  return RenderTemplate.withFx(({ renderTemplate }) => renderTemplate(template, values))
}

export function svg<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): Fx.Fx<
  RenderTemplate | Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  TemplateResult
> {
  return RenderTemplate.withFx(({ renderTemplate }) =>
    renderTemplate(template, values, { isSvg: true }),
  )
}

export function renderTemplate<Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  values: Values,
  options?: RenderTemplateOptions,
): Fx.Fx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  TemplateResult
> {
  return Fx.multicast(
    Fx.Fx<
      Placeholder.ResourcesOf<Values[number]>,
      Placeholder.ErrorsOf<Values[number]>,
      TemplateResult
    >(<R2>(sink: Fx.Sink<R2, Placeholder.ErrorsOf<Values[number]>, TemplateResult>) =>
      Effect.gen(function* ($) {
        const context = yield* $(Effect.context<Placeholder.ResourcesOf<Values[number]> | R2>())
        const deferred = yield* $(Deferred.make<never, void>())
        const result = new TemplateResult(template, values, options, context, sink, deferred)

        // Emit the Template Result for rendering by the runtime.
        yield* $(sink.event(result))

        // Await for the runtime to that the template has been removed.
        yield* $(Deferred.await(deferred))
      }),
    ),
  )
}
