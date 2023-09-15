import type * as Cause from "@effect/io/Cause"
import type { Fx } from "./core"

declare module "@effect/data/Option" {
  export interface None<A> extends Fx<never, Cause.NoSuchElementException, A> {}
  export interface Some<A> extends Fx<never, never, A> {}
}

declare module "@effect/data/Either" {
  export interface Left<E, A> extends Fx<never, E, A> {}
  export interface Right<E, A> extends Fx<never, E, A> {}
}

declare module "@effect/io/Cause" {
  export interface Empty extends Fx<never, never, never> {}
  export interface Fail<E> extends Fx<never, E, never> {}
  export interface Die extends Fx<never, never, never> {}
  export interface Interrupt extends Fx<never, never, never> {}
  export interface Annotated<E> extends Fx<never, E, never> {}
  export interface Sequential<E> extends Fx<never, E, never> {}
  export interface Parallel<E> extends Fx<never, E, never> {}
}

declare module "@effect/io/Exit" {
  export interface Failure<E, A> extends Fx<never, E, A> {}
  export interface Success<E, A> extends Fx<never, E, A> {}
}

declare module "@effect/io/Effect" {
  export interface Effect<R, E, A> extends Fx<R, E, A> {}
}

declare module "@effect/stream/Stream" {
  export interface Stream<R, E, A> extends Fx<R, E, A> {}
}
