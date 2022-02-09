import { HAS } from '@/Has'
import { pipe } from '@/Prelude/function'

import { access, provideAll } from './Effect'
import { Fx } from './Fx'

export const provide =
  <R2>(provided: R2) =>
  <R, E, A>(fx: Fx<R & R2, E, A>): Fx<R, E, A> =>
    access((r: R) => pipe(fx, provideAll(mergeResources(r, provided))))

export function mergeResources<R, R2>(r: R, r2: R2): R & R2 {
  const resources = {} as any

  Reflect.ownKeys(r as any).forEach((key) => {
    resources[key] = r[key as keyof R]
  })
  Reflect.ownKeys(r2 as any).forEach((key) => {
    if (key === HAS && HAS in resources) {
      resources[HAS] = mergeResources(resources[HAS], r2[HAS as keyof R2])
    } else {
      resources[key] = r2[key as keyof R2]
    }
  })

  return resources as R & R2
}

export function provideWith<R2, E2, R3>(provider: Fx<R2, E2, R3>) {
  return <R, E, A>(fx: Fx<R & R3, E, A>): Fx<R & R2, E | E2, A> =>
    Fx(function* () {
      const r3 = yield* provider

      return yield* pipe(fx, provide(r3))
    })
}
