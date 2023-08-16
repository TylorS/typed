import { Fx } from './Fx.js'
import { combineAll } from './combineAll.js'
import { map } from './map.js'

export function struct<FXS extends Readonly<Record<string, Fx<any, any, any>>>>(
  fx: FXS,
): Fx<
  Fx.Context<FXS[string]>,
  Fx.Error<FXS[string]>,
  {
    readonly [K in keyof FXS]: Fx.Success<FXS[K]>
  }
> {
  return map(
    combineAll(...Object.entries(fx).map(([key, value]) => map(value, (x) => [key, x] as const))),
    Object.fromEntries,
  )
}
