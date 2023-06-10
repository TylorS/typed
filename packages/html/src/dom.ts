import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import * as Fx from '@typed/fx'

import type { Placeholder } from './Placeholder.js'
import { RenderTemplate, RenderTemplateOptions } from './RenderTemplate.js'
import { Renderable } from './Renderable.js'
import { TemplateResult } from './TemplateResult.js'

export const dom: Layer.Layer<never, never, RenderTemplate> = RenderTemplate.layerOf({
  renderTemplate,
})

function renderTemplate<Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  values: Values,
  options?: RenderTemplateOptions,
): Fx.Fx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  TemplateResult
> {
  return Fx.Fx<
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
  )
}
