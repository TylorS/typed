import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import { Navigation, DomNavigationOptions } from '@typed/navigation'
import { describe, it } from 'vitest'

import { sharedEnvironment } from './_common.js'

describe('Navigation', () => {
  it('can navigate to a destination', async () => {
    const test = testNavigation(function* ($, navigation) {
      const destination = yield* $(navigation.navigate('/test'))

      console.log(destination)
    })

    await Effect.runPromise(test)
  })
})

const testNavigation = <Y extends Effect.EffectGen<any, any, any>, A>(
  f: (adapter: Effect.Adapter, navigation: Navigation) => Generator<Y, A, any>,
  options: DomNavigationOptions = {},
) =>
  Effect.gen(function* ($) {
    const navigation = yield* $(Navigation)
    const result = yield* f($, navigation)

    return result
  }).pipe(
    Effect.tapErrorCause(Effect.logError),
    Effect.provideSomeLayer(Layer.suspend(() => sharedEnvironment(options))),
    Effect.scoped,
  )
