import { And } from '@typed/fp/common/exports'
import { EnvOf } from '@typed/fp/Effect/exports'
import { EnvBrand } from '@typed/fp/patch/EnvBrand'

export const createTaggedTemplate = <F extends TaggedTemplateFn>(
  templateFunction: F,
): TaggedEffectTemplate<F> => templateFunction as TaggedEffectTemplate<F>

export type TaggedTemplateFn<R = unknown> = (
  template: TemplateStringsArray,
  ...values: readonly unknown[]
) => R

export type TaggedEffectTemplate<F extends TaggedTemplateFn> = <V extends ReadonlyArray<unknown>>(
  template: TemplateStringsArray,
  ...values: V
) => ReturnType<F> & { [EnvBrand]: EnvOfTemplateValues<V> }

export type EnvOfTemplateValues<Values extends ReadonlyArray<unknown>> = And<
  {
    [K in keyof Values]: Values[K] extends { [EnvBrand]: infer R } ? R : EnvOf<Values[K]>
  }
>

export type TemplateEnv<A> = A extends { [EnvBrand]: infer R } ? R : never
