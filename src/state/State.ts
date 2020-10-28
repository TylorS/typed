import { Shared } from './Shared'

export type State<A, B = A> = readonly [() => A, (b: B) => A]

export type SharedState<K extends string, A, B = A> = Shared<K, State<A, B>>

export type StateOf<A> = [A] extends [SharedState<string, infer R, any>] ? R : never
export type ActionOf<A> = [A] extends [SharedState<string, any, infer R>] ? R : never
