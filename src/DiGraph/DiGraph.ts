import { deepEqualsEq } from '@fp/common/exports'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { flatten, uniq } from 'fp-ts/ReadonlyArray'

export interface DiGraph<V> extends Eq<V> {
  readonly vertices: ReadonlyArray<V>
  readonly edges: Edges<V>
}

export type Edges<A> = ReadonlyArray<Edge<A>>
export type Edge<A> = readonly [from: A, to: A]

export function createDiGraph<V>(edges: Edges<V>, eq: Eq<V> = deepEqualsEq): DiGraph<V> {
  return {
    ...eq,
    vertices: pipe(edges, flatten, uniq(eq)),
    edges,
  }
}
