import { Head } from 'List/Head'
import { Tail } from 'List/Tail'

export type And<A extends readonly any[], B extends any = A> = {
  0: B extends A ? And<Tail<A>, Head<A>> : B & And<Tail<A>, Head<A>>
  1: B
}[A extends readonly [] ? 1 : 0]
