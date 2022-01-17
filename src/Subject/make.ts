import { Subject } from './Subject'

export function make<I>(): Subject<unknown, never, I> {
  return new Subject<unknown, never, I>()
}
