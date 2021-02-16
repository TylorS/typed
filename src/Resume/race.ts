import { disposeBoth } from '@most/disposable'
import { settable } from '@typed/fp/Disposable'
import { pipe } from 'fp-ts/function'

import { async } from './Async'
import { isSync, Resume } from './Resume'
import { run } from './run'

export const race = <A>(ra: Resume<A>) => <B>(rb: Resume<B>): Resume<A | B> => {
  if (isSync(rb)) {
    return rb
  }

  if (isSync(ra)) {
    return ra
  }

  return async((resume) => {
    const aDisposableLazy = settable()
    const bDisposable = pipe(
      rb,
      run((b) => {
        aDisposableLazy.dispose()
        return resume(b)
      }),
    )
    const aDisposable = pipe(
      ra,
      run((a) => {
        bDisposable.dispose()
        return resume(a)
      }),
    )

    aDisposableLazy.addDisposable(aDisposable)

    return disposeBoth(bDisposable, aDisposable)
  })
}
