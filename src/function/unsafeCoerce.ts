import { identity } from './identity'

export const unsafeCoerce: <A, B>(a: A) => B = identity as any
