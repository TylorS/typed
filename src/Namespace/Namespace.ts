import { Branded } from '@typed/fp/Branded'
import { unsafeCoerce } from 'fp-ts/dist/function'

export type Namespace<K extends PropertyKey = PropertyKey> = Branded<
  { readonly Namespace: K },
  PropertyKey
>

export const Namespace: <K extends PropertyKey>(k: K) => Namespace<K> = unsafeCoerce
