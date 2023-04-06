import * as P from '@effect/data/typeclass/Product'

import type { Fx, FxTypeLambda } from '@typed/fx/internal/Fx'
import { collectAll } from '@typed/fx/internal/constructor/collectAll'
import { map } from '@typed/fx/internal/operator/map'
import { Of } from '@typed/fx/internal/typeclass/Of'
import { SemiProduct } from '@typed/fx/internal/typeclass/SemiProduct'

export const Product: P.Product<FxTypeLambda> = {
  ...SemiProduct,
  ...Of,
  productAll: (iterable) => map(collectAll(iterable), (a) => Array.from(a)),
}

export const struct: <const R extends Readonly<Record<string, Fx<any, any, any>>>>(
  fields: R,
) => Fx<
  Fx.ResourcesOf<R[string]>,
  Fx.ErrorsOf<R[string]>,
  { readonly [K in keyof R]: Fx.OutputOf<R[K]> }
> = P.struct(Product) as <R extends Readonly<Record<string, Fx<any, any, any>>>>(
  fields: R,
) => Fx<
  Fx.ResourcesOf<R[string]>,
  Fx.ErrorsOf<R[string]>,
  {
    readonly [K in keyof R]: Fx.OutputOf<R[K]>
  }
>

export const tuple: <const R extends ReadonlyArray<Fx<any, any, any>>>(
  ...elements: R
) => Fx<
  Fx.ResourcesOf<R[number]>,
  Fx.ErrorsOf<R[number]>,
  { readonly [K in keyof R]: Fx.OutputOf<R[K]> }
> = P.tuple(Product) as <R extends ReadonlyArray<Fx<any, any, any>>>(
  ...elements: R
) => Fx<
  Fx.ResourcesOf<R[number]>,
  Fx.ErrorsOf<R[number]>,
  {
    readonly [K in keyof R]: Fx.OutputOf<R[K]>
  }
>
