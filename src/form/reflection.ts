import { FormDataObj } from './FormDataObj'

export const ownKeys = <A extends FormDataObj>(a: A): ReadonlyArray<keyof A> => Reflect.ownKeys(a)

export const getKey = <K extends PropertyKey>(k: K) => <A extends FormDataObj>(a: A): A[K] =>
  Reflect.get(a, k)
