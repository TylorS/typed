import * as Eff from '@effect/core/io/Effect'
import * as MC from '@most/core'
import * as MS from '@most/scheduler'
import { asap } from '@most/scheduler'
import * as MT from '@most/types'
import * as Fx from '@typed/fx'
import * as rxjs from 'rxjs'

import { PerformanceTestCase } from '@/benchmark/src/index.js'
import * as Effect from '@/io/src/Effect.js'
import * as Stream from '@/io/src/Stream.js'

export function effectTest<E, A>(init: () => Effect.Effect<never, E, A>) {
  return PerformanceTestCase('@typed/io/Effect', init, Effect.runMain)
}

export function streamEffectTest<E, A>(init: () => Effect.Effect<never, E, A>) {
  return PerformanceTestCase('@typed/io/Stream', init, Effect.runMain)
}

export function streamTest<E, A>(init: () => Stream.Stream<never, E, A>) {
  return streamEffectTest(() => Stream.runDrain(init()))
}

export function rxjsTest<A>(init: () => rxjs.Observable<A>) {
  return PerformanceTestCase('rxjs @7', init, (o) => new Promise((resolve) => o.subscribe(resolve)))
}

export function mostTest<A>(init: (fromArray: typeof mostFromArray) => MT.Stream<A>) {
  const scheduler = MS.newDefaultScheduler()

  return PerformanceTestCase(
    '@most/core',
    () => init(mostFromArray),
    (o) => MC.runEffects(o, scheduler),
  )
}

export function mostFromArray<A>(array: readonly A[]): MT.Stream<A> {
  const l = array.length
  return MC.newStream((sink, scheduler) =>
    asap(
      {
        run(t) {
          for (let i = 0; i < l; ++i) {
            sink.event(t, array[i])
          }
          sink.end(t)
        },
        error(t, e) {
          sink.error(t, e)
        },
        dispose() {
          // Nothing to dispose
        },
      },
      scheduler,
    ),
  )
}

export function effectCoreTest<E, A>(init: () => Eff.Effect<never, E, A>) {
  return PerformanceTestCase('@effect/core', init, Eff.unsafeRunPromise)
}

export function fxTest<E, A>(init: () => Fx.Fx<never, E, A>) {
  return PerformanceTestCase('@typed/fx', () => Fx.runDrain(init()), Eff.unsafeRunPromise)
}
