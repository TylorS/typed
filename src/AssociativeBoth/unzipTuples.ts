import { isTuple, Tuple } from '@/Tuple'

export type UnzipTuples<A, R extends readonly any[] = []> = A extends Tuple<infer T, infer U>
  ? UnzipTuples<U, [...R, T]>
  : readonly [...R, A]

export function unzipTuples<A extends Tuple<any, any>>(tuple: A): UnzipTuples<A> {
  const [a, b] = tuple

  if (Array.isArray(b) && isTuple(b)) {
    return [a, ...unzipTuples(b)] as unknown as UnzipTuples<A>
  }

  return [a, b] as unknown as UnzipTuples<A>
}
