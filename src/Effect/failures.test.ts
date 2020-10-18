import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/pipeable'

import { doEffect } from './doEffect'
import { catchError, fail } from './failures'
import { provideSome } from './provide'
import { execPure } from './runEffect'

export const test = describe(`failures`, [
  describe(`fail`, [
    it(`allows failing`, ({ equal }, done) => {
      const key = 'test'
      const error = 'fail'

      const sut = doEffect(function* () {
        yield* fail(key, error)
      })

      pipe(
        sut,
        provideSome({
          [key]: (e: typeof error) => {
            try {
              equal(e, error)
              done()
            } catch (error) {
              done(error)
            }
          },
        }),
        execPure,
      )
    }),
  ]),

  describe(`catchError`, [
    it(`allows handling errors`, ({ equal }, done) => {
      const key = 'test'
      const error = 'fail'
      const expected = 10

      const child = doEffect(function* () {
        yield* fail(key, error)

        return 5
      })

      const parent = doEffect(function* () {
        const n = yield* catchError(key, () => expected, child)

        try {
          equal(expected, n)
          done()
        } catch (error) {
          done(error)
        }
      })

      pipe(parent, execPure)
    }),
  ]),
])
