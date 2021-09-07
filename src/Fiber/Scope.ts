import { none, Option, some } from 'fp-ts/Option'

import { AtomicReference } from '@/AtomicReference'
import { FiberRefId } from '@/FiberRef'

export interface Scope<R> {
  readonly requirements: R
  readonly parent: WeakRef<Option<Scope<any>>>
  readonly children: Set<Scope<any>>
  readonly references: Map<FiberRefId, AtomicReference<any>>
}

export function makeEmptyScope<R>(requirements: R): Scope<R> {
  return {
    requirements,
    parent: new WeakRef(none),
    children: new Set(),
    references: new Map(),
  }
}

export function forkScope<R>(parent: Scope<R>): Scope<R> {
  return {
    requirements: parent.requirements,
    parent: new WeakRef(some(parent)),
    children: new Set(),
    references: new Map(parent.references), // Clone references
  }
}

export function joinScope<R, R2>(parent: Scope<R>, forked: Scope<R2>): Scope<R & R2> {
  return {
    ...parent,
    children: new Set(Array.from(parent.children).filter((x) => x !== forked)),
    references: new Map([...parent.references, ...forked.references]),
    requirements: {
      ...parent.requirements,
      ...forked.requirements,
    },
  }
}

export function updateRequirements<R, R1>(requirements: R, scope: Scope<R1>): Scope<R> {
  return {
    ...scope,
    requirements,
  }
}
