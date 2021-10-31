import { Option } from 'fp-ts/Option'

import { DepManager } from '@/Dep'
import { Exit } from '@/Exit'
import { Of } from '@/Fx'
import { MutableRef } from '@/MutableRef'

export type Scope<R, A> = LocalScope<R, A> | GlobalScope

export interface LocalScope<R, A> {
  readonly type: 'Local'
  /**
   * Requirements needed to run the Fx in this corresponding Scope
   */
  readonly requirements: R
  /**
   * The Exit status of this given Scope
   */
  readonly exit: MutableRef<Option<Exit<A>>>
  /**
   * Observers of the exit value when it is produces
   */
  readonly observers: MutableRef<ReadonlyArray<(exit: Exit<A>) => void>>
  /**
   * A mutable map of finalizers to run when this scope exits
   */
  readonly finalizers: Map<FinalizerKey, Finalizer>

  /**
   * Should be set to true after scope is closed and all Finalizers are being run.
   */
  readonly finalizing: MutableRef<boolean>

  /**
   * Should be set to true after scope is closed and all Finalizers have been run.
   */
  readonly finalized: MutableRef<boolean>

  /**
   * References to this Scope
   */
  readonly refCount: MutableRef<number>

  /**
   * A convenient reference to the "global" Scope
   */
  readonly global: GlobalScope
  /**
   * The parent scope
   */
  readonly parent: Option<Scope<unknown, any>>

  /**
   * The number of Fx regions within this scope that are currently marked as uninterruptable
   */
  readonly uninterruptibleRegions: MutableRef<number>

  /**
   * Observers who are waiting for this Scope to become interruptible
   */
  readonly interruptObservers: MutableRef<ReadonlyArray<() => void>>
}

export type Finalizer = (exit: Exit<any>) => Of<any>

export type FinalizerKey = symbol

/**
 * GlobalScope is intended only to allow creating daemon-like processes.
 */
export interface GlobalScope {
  readonly type: 'Global'
  /**
   * Daemon-like processes forked from the global Scope
   */
  readonly children: Set<Scope<unknown, any>>
  /**
   * sequenceNumber to utilize when creating a new FiberId
   */
  readonly sequenceNumber: MutableRef<number>
  /**
   * Global Dependencies for resource memoization
   */
  readonly deps: DepManager
}
