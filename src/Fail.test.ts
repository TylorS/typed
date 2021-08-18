import { disposeNone } from '@most/disposable'
import { deepStrictEqual, ok } from 'assert'
import { pipe } from 'fp-ts/function'
import { describe, it } from 'mocha'

import * as E from './Env'
import { catchError, throwError } from './Fail'
import { async, exec, start } from './Resume'

describe(__filename, () => {
  describe(throwError.name, () => {
    it(`places the requirement to handle an error in the environment`, (done) => {
      const key = 'foo' as const
      const error = new Error('failure')
      const fail = throwError(key)(error)

      pipe(
        {
          failures: {
            [key]: (e) =>
              async<never>(() => {
                try {
                  ok(error === e, 'Should throw expected error')
                  done()
                } catch (err) {
                  done(err)
                }

                return disposeNone()
              }),
          },
        },
        fail,
        exec,
      )
    })
  })

  describe(catchError.name, () => {
    it(`can provide a error handler`, (done) => {
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
            E.chainFirst((x) => E.of(deepStrictEqual(x, expected))),
          ),
          start(() => done()),
        )
      } catch (e) {
        done(e)
      }
    })
  })
})
