import { And } from '@typed/fp/common/exports'
import { EnvOf } from '@typed/fp/Effect/exports'
import { EnvBrand } from '@typed/fp/patch/EnvBrand'

export function createTaggedTemplate<
  F extends (template: TemplateStringsArray, ...values: readonly unknown[]) => unknown
>(templateFunction: F) {
  return <V extends ReadonlyArray<unknown>>(
    template: TemplateStringsArray,
    ...values: V
  ): ReturnType<F> & { [EnvBrand]: EnvOfTemplateValues<V> } =>
    templateFunction(template, ...values) as ReturnType<F> & { [EnvBrand]: EnvOfTemplateValues<V> }
}

export type TaggedEffectTemplate<
  F extends (template: TemplateStringsArray, ...values: readonly unknown[]) => unknown
> = <V extends ReadonlyArray<unknown>>(
  template: TemplateStringsArray,
  ...values: V
) => ReturnType<F> & { [EnvBrand]: EnvOfTemplateValues<V> }

export type EnvOfTemplateValues<Values extends ReadonlyArray<unknown>> = And<
  {
    [K in keyof Values]: Values[K] extends { [EnvBrand]: infer R } ? R : EnvOf<Values[K]>
  }
>

export type TemplateEnv<A> = A extends { [EnvBrand]: infer R } ? R : never
