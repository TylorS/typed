import { undisposable } from '@typed/fp/Disposable'
import { asks } from '@typed/fp/Env'
import { async, Resume } from '@typed/fp/Resume'
import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/function'
import { performance } from 'perf_hooks'

import { doEnv, fromEnv } from './Eff'
import { provideAll } from './provide'
import { runPure } from './runPure'

export const test = describe(`Eff`, [
  describe(`synchronous workflows`, [
    it(`wraps Env in generator-based do notation`, ({ equal }, done) => {
      const foo = doEnv(function* (_) {
        const a = yield* _(asks((e: { a: number }) => e.a))
        const b = yield* _(asks((e: { b: number }) => e.b))

        return a + b
      })

      pipe(
        foo,
        provideAll({ a: 1, b: 2 }),
        runPure(
          undisposable((a: number) => {
            try {
              equal(3, a)
              done()
            } catch (error) {
              done(error)
            }
          }),
        ),
      )
    }),
  ]),

  describe(`asynchronous workflows`, [
    it(`wraps Env in generator-based do notation`, ({ ok }, done) => {
      const foo = doEnv(function* (_) {
        const a = yield* _(asks((e: { a: number }) => e.a))
        const x = yield* fromEnv((e: { delay: (time: number) => Resume<number> }) => e.delay(a))

        return x
      })

      const start = performance.now()
      const delay = 100

      pipe(
        foo,
        provideAll({
          a: delay,
          delay: (e) =>
            async((resume) => {
              const id = setTimeout(() => resume(performance.now()), e)
              const dispose = () => clearTimeout(id)

              return { dispose }
            }),
        }),
        runPure(
          undisposable((end: number) => {
            try {
              ok(end - start > delay)
              done()
            } catch (error) {
              done(error)
            }
          }),
        ),
      )
    }),
  ]),
])
