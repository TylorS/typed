import { settable } from '@fp/Disposable'
import { Disposable } from '@most/types'
import { Task } from 'fp-ts/dist/Task'

export interface Async<A> {
  readonly _tag: 'async'
  readonly resume: AsyncResume<A>
}

export type AsyncResume<A> = (resume: (value: A) => Disposable) => Disposable

export const async = <A>(resume: AsyncResume<A>): Async<A> => ({ _tag: 'async', resume })

export const fromTask = <A>(task: Task<A>): Async<A> =>
  async((resume) => {
    const disposable = settable()

    task().then((r) => {
      if (!disposable.isDisposed()) {
        disposable.addDisposable(resume(r))
      }
    })

    return disposable
  })
