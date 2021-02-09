import { Disposable } from '@most/types'

export interface Async<A> {
  readonly _tag: 'async'
  readonly resume: AsyncResume<A>
}

export type AsyncResume<A> = (resume: (value: A) => Disposable) => Disposable

export const async = <A>(resume: AsyncResume<A>): Async<A> => ({ _tag: 'async', resume })
