import { Lazy } from './Lazy'

export function constant<A>(a: A): Lazy<A> {
  return (..._args: readonly any[]) => a
}

export const constTrue: Lazy<true> =
  /*#__PURE__*/
  constant(true)

export const constFalse: Lazy<false> =
  /*#__PURE__*/
  constant(false)

export const constNull: Lazy<null> =
  /*#__PURE__*/
  constant(null)

export const constUndefined: Lazy<undefined> =
  /*#__PURE__*/
  constant(undefined)

export const constVoid: Lazy<void> =
  /*#__PURE__*/
  constant(undefined)
