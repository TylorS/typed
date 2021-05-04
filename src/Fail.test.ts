import { disposeNone } from '@most/disposable'
import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { of } from './Env'
import { catchError, throwError } from './Fail'
import { Do } from './Fx/Env'
import { async, exec } from './Resume'

export const test = describe(__filename, [
  describe(throwError.name, [
    it(`places the requirement to handle an error in the environment`, ({ same }, done) => {
      const key = 'foo' as const
      const error = new Error('failure')
      const fail = throwError(key)(error)
      const test = Do(function* (_) {
        // eslint-disable-next-line no-constant-condition
        if (true) {
          return yield* _(fail)
        }

        return 1
      })

      pipe(
        {
          [key]: (e) =>
            async<never>(() => {
              try {
                same(error, e)
                done()
              } catch (err) {
                done(err)
              }

              return disposeNone()
            }),
        },
        test,
        exec,
      )
    }),
  ]),

  describe(catchError.name, [
    it(`can provide a error handler`, ({ equal }, done) => {
      const key = 'foo' as const
      const error = new Error('failure')
      const throwFoo = throwError(key)
      const catchFoo = catchError(key)
      const expected = 42
      const willFail = Do(function* (_) {
        // eslint-disable-next-line no-constant-condition
        if (true) {
          return yield* _(throwFoo(error))
        }

        return 1
      })

      const test = Do(function* (_) {
        try {
          const actual = yield* pipe(
            willFail,
            catchFoo(() => of(expected)),
            _,
          )

          equal(expected, actual)

          done()
        } catch (e) {
          done(e)
        }
      })

      pipe({}, test, exec)
    }),
  ]),
])
