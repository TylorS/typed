import { fromNullable, none, Option } from 'fp-ts/Option'

import { makeDepManager } from '@/Dep'
import { Exit } from '@/Exit'
import * as MutableRef from '@/MutableRef'

import { GlobalScope, LocalScope, Scope } from './Scope'

export interface LocalScopeOptions {
  readonly parent?: Scope<unknown, any>
  readonly global?: GlobalScope
}

export function makeLocalScope<R, A>(
  requirements: R,
  options: LocalScopeOptions = {},
): LocalScope<R, A> {
  return {
    type: 'Local',
    requirements,
    exit: MutableRef.make<Option<Exit<A>>>(none),
    observers: MutableRef.make<ReadonlyArray<(exit: Exit<A>) => void>>([]),
    parent: fromNullable(options.parent),
    finalizers: new Map(),
    finalizing: MutableRef.make<boolean>(false),
    finalized: MutableRef.make<boolean>(false),
    refCount: MutableRef.make<number>(0),
    uninterruptibleRegions: MutableRef.make(0),
    global: options.global ?? makeGlobalScope(),
    interruptObservers: MutableRef.make<ReadonlyArray<() => void>>([]),
  }
}

export function makeGlobalScope(): GlobalScope {
  return {
    type: 'Global',
    children: new Set(),
    sequenceNumber: MutableRef.make(0),
    deps: makeDepManager(),
  }
}
