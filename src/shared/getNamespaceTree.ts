import { Effect, map } from '@typed/fp/Effect/exports'
import { Tree } from 'fp-ts/Tree'

import { getNamespaceChildren, SharedEnv } from './SharedEnv'

export const getNamespaceTree = (root: PropertyKey): Effect<SharedEnv, Tree<PropertyKey>> =>
  map((children) => createTree(root, children), getNamespaceChildren)

function createTree(namespace: PropertyKey, children: Map<PropertyKey, Set<PropertyKey>>) {
  const tree: Tree<PropertyKey> = {
    value: namespace,
    forest: children.has(namespace)
      ? Array.from(children.get(namespace)!).map((n) => createTree(n, children))
      : [],
  }

  return tree
}
