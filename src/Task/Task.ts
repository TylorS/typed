import { Disposable } from '@/Disposable'

export interface Task<A> {
  readonly type: 'Task'
  readonly run: (cb: (value: A) => void) => Disposable
}
