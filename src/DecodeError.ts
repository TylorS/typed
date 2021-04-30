import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'

export type DecodeErrors<E> = ReadonlyNonEmptyArray<DecodeError<E>>

export type DecodeError<E> =
  | MissingKeyE<E>
  | UnexpectedKeyE<E>
  | KeyE<E>
  | MissingIndexE<E>
  | UnexpectedIndexE<E>
  | IndexE<E>
  | LeafE<E>
  | MemberE<E>
  | MessageE<E>

export const match = <Err, A, B, C, D, E, F, G, H, I>(
  errors: {
    [K in MissingKeyE<Err>['_tag']]: (key: PropertyKey, error: Err) => A
  } &
    {
      [K in UnexpectedKeyE<Err>['_tag']]: (key: PropertyKey, error: Err) => B
    } &
    {
      [K in KeyE<Err>['_tag']]: (key: PropertyKey, errors: DecodeErrors<Err>) => C
    } &
    {
      [K in MissingIndexE<Err>['_tag']]: (index: number, errors: Err) => D
    } &
    {
      [K in UnexpectedIndexE<Err>['_tag']]: (index: number, errors: Err) => E
    } &
    {
      [K in IndexE<Err>['_tag']]: (index: number, errors: DecodeErrors<Err>) => F
    } &
    {
      [K in LeafE<Err>['_tag']]: (actual: unknown, errors: Err) => G
    } &
    {
      [K in MemberE<Err>['_tag']]: (index: number, errors: DecodeErrors<Err>) => H
    } &
    {
      [K in MessageE<Err>['_tag']]: (message: Err, errors: DecodeErrors<Err>) => I
    },
) => (de: DecodeError<Err>): A | B | C | D | E | F | G | H | I => {
  switch (de._tag) {
    case 'index':
      return errors.index(de.index, de.errors)
    case 'key':
      return errors.key(de.key, de.errors)
    case 'leaf':
      return errors.leaf(de.actual, de.error)
    case 'member':
      return errors.member(de.member, de.errors)
    case 'message':
      return errors.message(de.message, de.errors)
    case 'missingIndex':
      return errors.missingIndex(de.index, de.error)
    case 'missingKey':
      return errors.missingKey(de.key, de.error)
    case 'unexpectedIndex':
      return errors.unexpectedIndex(de.index, de.error)
    case 'unexpectedKey':
      return errors.unexpectedKey(de.key, de.error)
  }
}

export interface LeafE<E> extends ActualE<unknown>, SingleE<E> {
  readonly _tag: 'leaf'
}

export const leafE = <E>(actual: unknown, error: E): LeafE<E> => ({ _tag: 'leaf', actual, error })

export interface MissingKeyE<E> extends SingleE<E> {
  readonly _tag: 'missingKey'
  readonly key: PropertyKey
}

export const missingKeyE = <E>(key: PropertyKey, error: E): MissingKeyE<E> => ({
  _tag: 'missingKey',
  key,
  error,
})

export interface UnexpectedKeyE<E> extends SingleE<E> {
  readonly _tag: 'unexpectedKey'
  readonly key: PropertyKey
}

export const unexpectedKeyE = <E>(key: PropertyKey, error: E): UnexpectedKeyE<E> => ({
  _tag: 'unexpectedKey',
  key,
  error,
})

export interface KeyE<E> extends CompoundE<E> {
  readonly _tag: 'key'
  readonly key: PropertyKey
}

export const keyE = <E>(key: PropertyKey, errors: DecodeErrors<E>): KeyE<E> => ({
  _tag: 'key',
  key,
  errors,
})

export interface MissingIndexE<E> extends SingleE<E> {
  readonly _tag: 'missingIndex'
  readonly index: number
}

export interface UnexpectedIndexE<E> extends SingleE<E> {
  readonly _tag: 'unexpectedIndex'
  readonly index: number
}

export interface IndexE<E> extends CompoundE<E> {
  readonly _tag: 'index'
  readonly index: number
}

export interface MemberE<E> extends CompoundE<E> {
  readonly _tag: 'member'
  readonly member: number
}

export interface MessageE<E> extends CompoundE<E> {
  readonly _tag: 'message'
  readonly message: E
}

export interface ActualE<I> {
  readonly actual: I
}

export interface SingleE<E> {
  readonly error: E
}

export interface CompoundE<E> {
  readonly errors: ReadonlyNonEmptyArray<DecodeError<E>>
}
