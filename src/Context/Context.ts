import type { Option } from 'fp-ts/Option'

import type { Renderer } from '@/Cause'
import type { FiberLocal } from '@/FiberLocal'
import type { Fx, Of } from '@/Fx'
import type { MutableRef } from '@/MutableRef'
import type { Scheduler } from '@/Scheduler'
import type { Stream } from '@/Stream'

export interface Context {
  /**
   * The Scheduler to use for Time + Async tasks
   */
  readonly scheduler: Scheduler
  /**
   * FiberLocal state within this Context
   */
  readonly locals: ContextLocals
  /**
   * Renderer of errors that occur within this Context
   */
  readonly renderer: Renderer
  /**
   * The parent context, if any.
   */
  readonly parent: MutableRef<Option<Context>>
}

export interface ContextLocals {
  readonly events: FiberLocalEvents
  readonly get: <R, A>(local: FiberLocal<R, A>) => Fx<R, A>
  readonly set: <R, A>(local: FiberLocal<R, A>, value: A) => Fx<R, A>
  readonly delete: <R, A>(local: FiberLocal<R, A>) => Of<Option<A>>
  readonly inherit: Of<void>
  readonly fork: () => ContextLocals
}

export interface FiberLocalEvents extends Stream<unknown, FiberLocalEvent<any, any>> {}

export type FiberLocalEvent<R, A> =
  | FiberLocalCreated<R, A>
  | FiberLocalUpdated<R, A>
  | FiberLocalDeleted<R, A>

export interface FiberLocalCreated<R, A> {
  readonly type: 'FiberLocal/Created'
  readonly fiberLocal: FiberLocal<R, A>
  readonly value: A
}

export interface FiberLocalUpdated<R, A> {
  readonly type: 'FiberLocal/Updated'
  readonly fiberLocal: FiberLocal<R, A>
  readonly previous: A
  readonly value: A
}

export interface FiberLocalDeleted<R, A> {
  readonly type: 'FiberLocal/Deleted'
  readonly fiberLocal: FiberLocal<R, A>
  readonly value: A
}

export interface Locals extends Map<FiberLocal<any, any>, any> {}
