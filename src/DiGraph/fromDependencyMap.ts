import { deepEqualsEq } from '@fp/common/exports'
import { Eq } from 'fp-ts/Eq'

import { createDiGraph, DiGraph } from './DiGraph'
import { DependencyMap } from './toDependencyMap'

export function fromDependencyMap<A>(map: DependencyMap<A>, eq: Eq<A> = deepEqualsEq): DiGraph<A> {
  return createDiGraph(
    Array.from(map).flatMap(([from, deps]) => deps.map((dep) => [from, dep])),
    eq,
  )
}
