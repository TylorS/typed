import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { pipe } from '@effect/data/Function'

import type { Placeholder } from './Placeholder.js'
import { Renderable } from './Renderable.js'
import { TemplateResult } from './TemplateResult.js'

export interface TemplateFx<R, E, A> extends Fx.Fx<R, E, A> {
  readonly template: TemplateStringsArray
}

export function html<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): TemplateFx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  TemplateResult
> {
  return Object.assign(renderTemplate(template, values), { template })
}

export function svg<const Values extends ReadonlyArray<Renderable<any, any>>>(
  template: TemplateStringsArray,
  ...values: Values
): TemplateFx<
  Placeholder.ResourcesOf<Values[number]>,
  Placeholder.ErrorsOf<Values[number]>,
  TemplateResult
> {
  return Object.assign(renderTemplate(template, values, { isSvg: true }), { template })
}

export interface RenderTemplateOptions {
  readonly isSvg?: boolean
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
        pipe(
          Effect.context<Placeholder.ResourcesOf<Values[number]> | R2>(),
          Effect.bindTo('context'),
          Effect.bind('deferred', () => Deferred.make<never, void>()),
          Effect.let('result', ({ context, deferred }) =>
            new TemplateResult(template, values, options, context, sink, deferred)
          ),
          Effect.tap(({ result }) => sink.event(result)),
          Effect.flatMap(({ deferred }) => Deferred.await(deferred)),
        )
    ),
  )
}
