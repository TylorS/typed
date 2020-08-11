import { Arity1 } from '@typed/fp/common'
import { disposeBoth, disposeNone } from '@typed/fp/Disposable'
import { isNone, none, Option, some } from 'fp-ts/es6/Option'
import { async, Resume, sync } from './Effect'
import { runResume } from './runResume'

export const apResume = <A, B>(fn: Resume<Arity1<A, B>>, value: Resume<A>): Resume<B> => {
  if (!fn.async && !value.async) {
    return sync(fn.value(value.value))
  }

  return async((cb) => {
    let f: Option<Arity1<A, B>> = none
    let v: Option<A> = none

    const onValue = () => {
      if (isNone(f) || isNone(v)) {
        return disposeNone()
      }

      return cb(f.value(v.value))
    }

    return disposeBoth(
      runResume(fn, (ab) => {
        f = some(ab)

        return onValue()
      }),
      runResume(value, (a) => {
        v = some(a)

        return onValue()
      }),
    )
  })
}
