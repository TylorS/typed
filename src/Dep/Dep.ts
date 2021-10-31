import { Branded } from '@/Branded'
import { Fx } from '@/Fx'

export type Dep<A> = Branded<PropertyKey, { readonly Dep: A }>

let depId = 0

export const Dep = <A>(id: PropertyKey = Symbol(`${depId++}`)): Dep<A> => Branded<Dep<A>>()(id)

export interface Provider<R, A> {
  readonly id: Dep<A>
  readonly provider: Fx<R, A>
}
