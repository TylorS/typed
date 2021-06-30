import * as E from '@fp/Env'
import { catchError, throwError } from '@fp/Fail'
import { async, exec, start } from '@fp/Resume'
import { disposeNone } from '@most/disposable'
import { describe, it } from '@typed/test'
import { flow, pipe } from 'fp-ts/function'

export const test = describe(__filename, [
  describe(throwError.name, [
    it(`places the requirement to handle an error in the environment`, ({ same }, done) => {
      const key = 'foo' as const
      const error = new Error('failure')
      const fail = throwError(key)(error)

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
        fail,
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

      try {
        pipe(
          {},
          pipe(
            throwFoo(error),
            catchFoo(() => E.of(expected)),
            E.chainFirst(flow(equal(expected), E.of)),
          ),
          start(() => done()),
        )
      } catch (e) {
        done(e)
      }
    }),
  ]),
])
