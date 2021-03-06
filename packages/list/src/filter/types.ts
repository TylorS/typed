import { List } from '../types'

export type Filter = {
  <A>(f: (a: A, index: number) => boolean, list: List<A>): Array<A>
  <A, B extends A>(f: (a: A, index: number) => a is B, list: List<A | B>): Array<B>

  <A>(f: (a: A, index: number) => boolean): (list: List<A>) => Array<A>
  <A, B extends A>(f: (a: A, index: number) => a is B): (list: List<A | B>) => Array<B>
}
