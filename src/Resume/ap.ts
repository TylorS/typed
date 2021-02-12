import { settable, undisposable } from '@fp/Disposable'
import { Arity1 } from '@fp/lambda'
import { isNone, none, Option, some } from 'fp-ts/Option'

import { async } from './Async'
import { isAsync, isSync, Resume } from './Resume'
import { sync } from './Sync'

export const ap = <A>(fa: Resume<A>) => <B>(fab: Resume<Arity1<A, B>>): Resume<B> => {
  if (isSync(fa) && isSync(fab)) {
    return sync(() => fab.resume()(fa.resume()))
  }

  return async((resume) => {
    const disposable = settable()

    let ab: Option<Arity1<A, B>> = isSync(fab) ? some(fab.resume()) : none
    let a: Option<A> = isSync(fa) ? some(fa.resume()) : none

    function onReady() {
      if (isNone(ab) || isNone(a)) {
        return
      }

      if (!disposable.isDisposed()) {
        disposable.addDisposable(resume(ab.value(a.value)))
      }
    }

    if (isAsync(fab)) {
      disposable.addDisposable(
        fab.resume(
          undisposable((f) => {
            ab = some(f)
            onReady()
          }),
        ),
      )
    }

    if (isAsync(fa)) {
      disposable.addDisposable(
        fa.resume(
          undisposable((x) => {
            a = some(x)
            onReady()
          }),
        ),
      )
    }

    return disposable
  })
}
