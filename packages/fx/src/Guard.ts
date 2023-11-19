import { Effect, Option } from "effect"
import { dual } from "effect/Function"

export type Guard<I, R, E, O> = (input: I) => Effect.Effect<R, E, Option.Option<O>>

export const compose: {
  <O, R2, E2, B>(output: Guard<O, R2, E2, B>): <I, R, E>(input: Guard<I, R, E, O>) => Guard<I, R | R2, E | E2, B>
  <I, R, E, O, R2, E2, B>(input: Guard<I, R, E, O>, output: Guard<O, R2, E2, B>): Guard<I, R | R2, E | E2, B>
} = dual(2, function flatMap<I, R, E, O, R2, E2, B>(
  input: Guard<I, R, E, O>,
  output: Guard<O, R2, E2, B>
): Guard<I, R | R2, E | E2, B> {
  return (i) =>
    Effect.flatMap(
      input(i),
      Option.match({
        onNone: () => Effect.succeedNone,
        onSome: output
      })
    )
})

export const mapEffect: {
  <O, R2, E2, B>(
    f: (o: O) => Effect.Effect<R2, E2, B>
  ): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R | R2, E | E2, B>
  <I, R, E, O, R2, E2, B>(guard: Guard<I, R, E, O>, f: (o: O) => Effect.Effect<R2, E2, B>): Guard<I, R | R2, E | E2, B>
} = dual(2, function mapEffect<I, R, E, O, R2, E2, B>(
  guard: Guard<I, R, E, O>,
  f: (o: O) => Effect.Effect<R2, E2, B>
): Guard<I, R | R2, E | E2, B> {
  return compose(guard, (o) => Effect.asSome(f(o)))
})

export const map: {
  <O, B>(f: (o: O) => B): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, B>
  <I, R, E, O, B>(guard: Guard<I, R, E, O>, f: (o: O) => B): Guard<I, R, E, B>
} = dual(2, function map<I, R, E, O, B>(
  guard: Guard<I, R, E, O>,
  f: (o: O) => B
): Guard<I, R, E, B> {
  return mapEffect(guard, (o) => Effect.sync(() => f(o)))
})

export const tap: {
  <O, R2, E2, B>(
    f: (o: O) => Effect.Effect<R2, E2, B>
  ): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R | R2, E | E2, O>
  <I, R, E, O, R2, E2, B>(guard: Guard<I, R, E, O>, f: (o: O) => Effect.Effect<R2, E2, B>): Guard<I, R | R2, E | E2, O>
} = dual(2, function tap<I, R, E, O, R2, E2, B>(
  guard: Guard<I, R, E, O>,
  f: (o: O) => Effect.Effect<R2, E2, B>
): Guard<I, R | R2, E | E2, O> {
  return compose(guard, (o) => Effect.as(f(o), Option.some(o)))
})

export const filterMap: {
  <O, B>(f: (o: O) => Option.Option<B>): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, B>
  <I, R, E, O, B>(guard: Guard<I, R, E, O>, f: (o: O) => Option.Option<B>): Guard<I, R, E, B>
} = dual(
  2,
  <I, R, E, O, B>(guard: Guard<I, R, E, O>, f: (o: O) => Option.Option<B>): Guard<I, R, E, B> => (i) =>
    Effect.map(guard(i), Option.filterMap(f))
)

export const filter: {
  <O, O2 extends O>(predicate: (o: O) => o is O2): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, O2>
  <O>(predicate: (o: O) => boolean): <I, R, E>(guard: Guard<I, R, E, O>) => Guard<I, R, E, O>
  <I, R, E, O, O2 extends O>(guard: Guard<I, R, E, O>, predicate: (o: O) => o is O2): Guard<I, R, E, O2>
  <I, R, E, O>(guard: Guard<I, R, E, O>, predicate: (o: O) => boolean): Guard<I, R, E, O>
} = dual(
  2,
  <I, R, E, O>(guard: Guard<I, R, E, O>, predicate: (o: O) => boolean): Guard<I, R, E, O> => (i) =>
    Effect.map(guard(i), Option.filter(predicate))
)
