import { Include } from './Include'

export type TupleKeys<A> = Include<keyof A, number>
