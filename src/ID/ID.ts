import { Branded } from '@typed/fp/Branded'
import { unsafeCoerce } from 'fp-ts/dist/function'

export type ID<A> = Branded<{ readonly ID: unique symbol }, A>

export const ID: <K>(k: K) => ID<K> = unsafeCoerce
