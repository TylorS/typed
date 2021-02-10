import { Kind2, Kind3, URIS2, URIS3 } from 'fp-ts/dist/HKT'
import { U } from 'ts-toolbelt'

export type Widen<W, Type extends WidenType | undefined> = Type extends WidenType
  ? {
      union: W
      intersection: Intersect<U.ListOf<W>>
    }[Type]
  : W

export type WidenType = 'union' | 'intersection'

export type Intersect<A extends readonly any[], R = unknown> = A extends [infer Head, ...infer Tail]
  ? Intersect<Tail, Head & R>
  : R

export type GetKind3R<F extends URIS3, A, W extends WidenType | undefined = 'union'> = [A] extends [
  Kind3<F, infer R, any, any>,
]
  ? Widen<R, W>
  : never

export type GetKind3E<F extends URIS3, A, W extends WidenType | undefined = 'union'> = [A] extends [
  Kind3<F, any, infer R, any>,
]
  ? Widen<R, W>
  : never

export interface WideningOptions {
  readonly 2?: WidenType
  readonly 3?: WidenType
}

export type GetKind2E<F extends URIS2, A, W extends WidenType | undefined> = [A] extends [
  Kind2<F, infer R, any>,
]
  ? Widen<R, W>
  : never

export interface UnionWiden extends WideningOptions {
  readonly 2: 'union'
  readonly 3: 'union'
}

export interface IntersectionWiden extends WideningOptions {
  readonly 2: 'intersection'
  readonly 3: 'intersection'
}

export function intersect<A, B>(a: A, b: B): Widen<A | B, 'intersection'> {
  return { ...a, ...b } as Widen<A | B, 'intersection'>
}
