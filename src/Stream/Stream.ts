import { Context } from '@/Context'
import { Disposable } from '@/Disposable'
import { Of } from '@/Fx'
import { LocalScope } from '@/Scope'

export interface Stream<R, A> {
  readonly run: Run<R, A>
}

export type RequirementsOf<T> = T extends Stream<infer R, any> ? R : never
export type OutputOf<T> = T extends Stream<any, infer A> ? A : never

export interface RunParams<R> {
  readonly context: Context
  readonly scope: LocalScope<R, void>
}

export type Run<R, A> = (sink: Sink<A>, params: RunParams<R>) => Disposable

export interface Sink<A> {
  readonly event: (a: A) => Of<void>
  readonly error: (error: unknown) => Of<void>
  readonly end: Of<void>
}
