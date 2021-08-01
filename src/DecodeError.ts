/**
 * DecodeError representation of the various errors that might occur while decoding.
 * @since 0.9.4
 */
import { flow, pipe } from 'fp-ts/function'
import * as RA from 'fp-ts/ReadonlyArray'
import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'
import { Semigroup } from 'fp-ts/Semigroup'
import * as T from 'fp-ts/Tree'

/**
 * @category Model
 * @since 0.9.4
 */
export interface Leaf {
  readonly _tag: 'Leaf'
  readonly actual: unknown
  readonly error: string
}

/**
 * @category Model
 * @since 0.9.4
 */
export interface Key {
  readonly _tag: 'Key'
  readonly key: string
  readonly errors: DecodeErrors
}

/**
 * @category Model
 * @since 0.9.4
 */
export interface MissingKeys {
  readonly _tag: 'MissingKeys'
  readonly keys: readonly [string, ...string[]]
}

/**
 * @category Model
 * @since 0.9.4
 */
export interface UnexpectedKeys {
  readonly _tag: 'UnexpectedKeys'
  readonly keys: readonly [string, ...string[]]
}

/**
 * @category Model
 * @since 0.9.4
 */
export interface Index {
  readonly _tag: 'Index'
  readonly index: number
  readonly errors: DecodeErrors
}

/**
 * @category Model
 * @since 0.9.4
 */
export interface MissingIndexes {
  readonly _tag: 'MissingIndexes'
  readonly indexes: readonly [number, ...number[]]
}

/**
 * @category Model
 * @since 0.9.4
 */
export interface UnexpectedIndexes {
  readonly _tag: 'UnexpectedIndexes'
  readonly indexes: readonly [number, ...number[]]
}

/**
 * @category Model
 * @since 0.9.4
 */
export interface Member {
  readonly _tag: 'Member'
  readonly index: number
  readonly errors: DecodeErrors
}

/**
 * @category Model
 * @since 0.9.4
 */
export interface Lazy {
  readonly _tag: 'Lazy'
  readonly id: string
  readonly errors: DecodeErrors
}

/**
 * @category Model
 * @since 2.2.9
 */
export interface Wrap {
  readonly _tag: 'Wrap'
  readonly error: string
  readonly errors: DecodeErrors
}

/**
 * @category Model
 * @since 0.9.4
 */
export type DecodeError =
  | Leaf
  | Key
  | MissingKeys
  | UnexpectedKeys
  | Index
  | MissingIndexes
  | UnexpectedIndexes
  | Member
  | Lazy
  | Wrap

/**
 * @since 0.9.4
 * @categeory Model
 */
export type DecodeErrors = ReadonlyNonEmptyArray<DecodeError>

/**
 * @category constructors
 * @since 0.9.4
 */
export const leaf = (actual: unknown, error: string): DecodeError => ({
  _tag: 'Leaf',
  actual,
  error,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const key = (key: string, errors: DecodeErrors): DecodeError => ({
  _tag: 'Key',
  key,
  errors,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const missingKeys = (keys: readonly [string, ...string[]]): DecodeError => ({
  _tag: 'MissingKeys',
  keys,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const unexpectedKeys = (keys: readonly [string, ...string[]]): DecodeError => ({
  _tag: 'UnexpectedKeys',
  keys,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const index = (index: number, errors: DecodeErrors): DecodeError => ({
  _tag: 'Index',
  index,
  errors,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const missingIndexes = (indexes: readonly [number, ...number[]]): DecodeError => ({
  _tag: 'MissingIndexes',
  indexes,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const unexpectedIndexes = (indexes: readonly [number, ...number[]]): DecodeError => ({
  _tag: 'UnexpectedIndexes',
  indexes,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const member = (index: number, errors: DecodeErrors): DecodeError => ({
  _tag: 'Member',
  index,
  errors,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const lazy = (id: string, errors: DecodeErrors): DecodeError => ({
  _tag: 'Lazy',
  id,
  errors,
})

/**
 * @category constructors
 * @since 2.2.9
 */
export const wrap = (error: string, errors: DecodeErrors): DecodeError => ({
  _tag: 'Wrap',
  error,
  errors,
})

/**
 * @category destructors
 * @since 0.9.4
 */
export const match = <R>(patterns: {
  Leaf: (input: unknown, error: string) => R
  Key: (key: string, errors: DecodeErrors) => R
  MissingKeys: (keys: readonly [string, ...string[]]) => R
  UnexpectedKeys: (keys: readonly [string, ...string[]]) => R
  Index: (index: number, errors: DecodeErrors) => R
  MissingIndexes: (indexes: readonly [number, ...number[]]) => R
  UnexpectedIndexes: (keys: readonly [number, ...number[]]) => R
  Member: (index: number, errors: DecodeErrors) => R
  Lazy: (id: string, errors: DecodeErrors) => R
  Wrap: (error: string, errors: DecodeErrors) => R
}): ((e: DecodeError) => R) => {
  const f = (e: DecodeError): R => {
    switch (e._tag) {
      case 'Leaf':
        return patterns.Leaf(e.actual, e.error)
      case 'Key':
        return patterns.Key(e.key, e.errors)
      case 'MissingKeys':
        return patterns.MissingKeys(e.keys)
      case 'UnexpectedKeys':
        return patterns.UnexpectedKeys(e.keys)
      case 'Index':
        return patterns.Index(e.index, e.errors)
      case 'MissingIndexes':
        return patterns.MissingIndexes(e.indexes)
      case 'UnexpectedIndexes':
        return patterns.UnexpectedIndexes(e.indexes)
      case 'Member':
        return patterns.Member(e.index, e.errors)
      case 'Lazy':
        return patterns.Lazy(e.id, e.errors)
      case 'Wrap':
        return patterns.Wrap(e.error, e.errors)
    }
  }
  return f
}

/**
 * @category Typeclass Constructor
 * @since 0.9.4
 */
export function getSemigroup(): Semigroup<DecodeErrors> {
  return RA.getSemigroup<DecodeError>() as any as Semigroup<DecodeErrors>
}

/**
 * @category Deconstructor
 * @since 0.9.4
 */
export const drawError = flow(toTree, T.drawTree)

/**
 * @category Deconstructor
 * @since 0.9.4
 */
export const drawErrors = flow(RA.map(flow(toTree, T.drawTree)), (ss) => ss.join('\n'))

function toForest(errors: DecodeErrors): T.Forest<string> {
  return errors.map(toTree)
}

function toTree(error: DecodeError): T.Tree<string> {
  return pipe(
    error,
    match({
      Leaf: (i, error) => T.of(`Expected ${error} but received ${JSON.stringify(i)}`),
      Key: (key, errors) => ({ value: `Key ${key}`, forest: toForest(errors) }),
      MissingKeys: (keys) => ({ value: `MissingKeys`, forest: pipe(keys, RA.map(T.of)) }),
      UnexpectedKeys: (keys) => ({ value: `UnexpectedKeys`, forest: pipe(keys, RA.map(T.of)) }),
      Index: (Index, errors) => ({ value: `Index ${Index}`, forest: toForest(errors) }),
      MissingIndexes: (indexes) => ({
        value: `Missing indexes`,
        forest: pipe(indexes, RA.map(flow(String, T.of))),
      }),
      UnexpectedIndexes: (indexes) => ({
        value: `Undexpected Indexes`,
        forest: pipe(indexes, RA.map(flow(String, T.of))),
      }),
      Member: (index, errors) => ({
        value: `${index}`,
        forest: toForest(errors),
      }),
      Lazy: (id, errors) => ({
        value: id,
        forest: toForest(errors),
      }),
      Wrap: (error, errors) => ({
        value: error,
        forest: toForest(errors),
      }),
    }),
  )
}
