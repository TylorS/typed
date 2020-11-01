import { Effect, map } from '@typed/fp/Effect/exports'
import { pipe } from 'fp-ts/function'
import { Tree } from 'fp-ts/Tree'

import { getSharedEnv, SharedEnv } from './SharedEnv'
import { usingNamespace } from './usingNamespace'

/**
 * Takes the current snapshot of namespaces into a Tree.
 * Can be helpful if perhaps you wanted to have a dev tool that had an
 * always up-to-date display of the current state in a particular namespace.
 * You might be able to listen to all of the SharedEvents occuring and create
 * snapshots from the namespace that has been updated.
 */
export const getNamespaceTree = (root: PropertyKey): Effect<SharedEnv, Tree<PropertyKey>> =>
  pipe(
    map(({ children }) => createTree(root, children), getSharedEnv),
    usingNamespace(root),
  )

function createTree(namespace: PropertyKey, children: Map<PropertyKey, Set<PropertyKey>>) {
  const tree: Tree<PropertyKey> = {
    value: namespace,
    forest: children.has(namespace)
      ? Array.from(children.get(namespace)!).map((n) => createTree(n, children))
      : [],
  }

  return tree
}
