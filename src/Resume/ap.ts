import { settable } from '@fp/Disposable'
import { Arity1 } from '@fp/lambda'
import { disposeNone } from '@most/disposable'
import { isNone, none, Option, some } from 'fp-ts/Option'

import { async } from './Async'
import { isAsync, isSync, Resume } from './Resume'
import { sync } from './Sync'

export const ap = <A>(fa: Resume<A>) => <B>(fab: Resume<Arity1<A, B>>): Resume<B> => {
  if (isSync(fa) && isSync(fab)) {
    return sync(() => fab.resume()(fa.resume()))
  }

  // Concurrently
  return async((resume) => {
    const disposable = settable()

    let ab: Option<Arity1<A, B>> = isSync(fab) ? some(fab.resume()) : none
    let a: Option<A> = isSync(fa) ? some(fa.resume()) : none

    function onReady() {
      if (isNone(ab) || isNone(a)) {
        return disposeNone()
      }

      if (!disposable.isDisposed()) {
        return disposable.addDisposable(resume(ab.value(a.value)))
      }

      return disposeNone()
    }

    if (isAsync(fab)) {
      disposable.addDisposable(
        fab.resume((f) => {
          ab = some(f)

          return onReady()
        }),
      )
    }

    if (isAsync(fa)) {
      disposable.addDisposable(
        fa.resume((x) => {
          a = some(x)

          return onReady()
        }),
      )
    }

    return disposable
  })
}
