import { Head } from 'List/Head'
import { Tail } from 'List/Tail'

export type Or<A extends any[], B extends any = A> = {
  0: B extends A ? Or<Tail<A>, Head<A>> : B | Or<Tail<A>, Head<A>>
  1: B
}[A extends [] ? 1 : 0]
