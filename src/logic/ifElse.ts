import { Arity1 } from '@fp/common/exports'
import { curry } from '@fp/lambda/exports'
import { Predicate } from 'fp-ts/function'
import { Is } from 'io-ts'

/**
 * If-else statement for functions.
 * @param predicate (a -> boolean)
 * @param thenFn (a -> b)
 * @param elseFn (a -> b)
 * @param value a
 * @returns b
 */
export const ifElse: IfElseFn = curry(__ifElse) as IfElseFn

function __ifElse<A, B>(
  predicate: Predicate<A>,
  thenFn: Arity1<A, B>,
  elseFn: Arity1<A, B>,
  value: A,
): B {
  if (predicate(value)) {
    return thenFn(value)
  }

  return elseFn(value)
}

export interface IfElseFn {
  <A, B extends A, C>(predicate: Is<B>, thenFn: Arity1<B, C>, elseFn: Arity1<A, C>, value: A): C
  <A, B>(predicate: Predicate<A>, thenFn: Arity1<A, B>, elseFn: Arity1<A, B>, value: A): B

  <A, B extends A, C>(predicate: Is<B>, thenFn: Arity1<B, C>, elseFn: Arity1<A, C>): (value: A) => C
  <A, B>(predicate: Predicate<A>, thenFn: Arity1<A, B>, elseFn: Arity1<A, B>): (value: A) => B

  <A, B extends A, C>(predicate: Is<B>, thenFn: Arity1<B, C>): {
    (elseFn: Arity1<A, C>, value: A): C
    (elseFn: Arity1<A, C>): (value: A) => C
  }
  <A, B>(predicate: Predicate<A>, thenFn: Arity1<A, B>): {
    (elseFn: Arity1<A, B>, value: A): B
    (elseFn: Arity1<A, B>): (value: A) => B
  }

  <A, B extends A>(predicate: Is<B>): {
    <C>(thenFn: Arity1<B, C>, elseFn: Arity1<A, C>, value: A): C
    <C>(thenFn: Arity1<B, C>, elseFn: Arity1<A, C>): (value: A) => C
    <C>(thenFn: Arity1<B, C>): {
      (elseFn: Arity1<A, C>, value: A): C
      (elseFn: Arity1<A, C>): (value: A) => C
    }
  }

  <A>(predicate: Predicate<A>): {
    <B>(thenFn: Arity1<A, B>, elseFn: Arity1<A, B>, value: A): B
    <B>(thenFn: Arity1<A, B>, elseFn: Arity1<A, B>): (value: A) => B
    <B>(thenFn: Arity1<A, B>): {
      (elseFn: Arity1<A, B>, value: A): B
      (elseFn: Arity1<A, B>): (value: A) => B
    }
  }
}
