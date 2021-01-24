import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'

import { DiGraph } from './DiGraph'
import { toDependencyMap } from './toDependencyMap'

export function getStronglyConnectedComponents<A>(
  graph: DiGraph<A>,
): ReadonlyArray<ReadonlyNonEmptyArray<A>> {
  const indices = new Map<A, number>()
  const lowlinks = new Map<A, number>()
  const onStack = new Set<A>()
  const stack: A[] = []
  const stronglyConnectedComponents: Array<NonEmptyArray<A>> = []
  const dependencyMap = toDependencyMap(graph)

  let index = 0

  for (const v of dependencyMap.keys()) {
    if (!indices.has(v)) {
      strongConnect(v)
    }
  }

  return stronglyConnectedComponents

  function strongConnect(v: A) {
    indices.set(v, index)
    lowlinks.set(v, index++)
    stack.push(v)
    onStack.add(v)

    const dependencies = dependencyMap.get(v)

    if (dependencies) {
      for (const dependency of dependencies) {
        const hasNotBeenSeenBefore = !indices.has(dependency)

        if (hasNotBeenSeenBefore) {
          strongConnect(dependency)
        }

        if (hasNotBeenSeenBefore || onStack.has(dependency)) {
          const depIndex = hasNotBeenSeenBefore
            ? lowlinks.get(dependency)!
            : indices.get(dependency)!

          lowlinks.set(v, Math.min(lowlinks.get(v)!, depIndex))
        }
      }
    }

    if (lowlinks.get(v)! === indices.get(v)) {
      const vertices = new Set<A>()

      let current: A | null = null
      while (v !== current) {
        current = stack.pop()!
        onStack.delete(current)
        vertices.add(current)
      }

      stronglyConnectedComponents.push(Array.from(vertices) as NonEmptyArray<A>)
    }
  }
}
