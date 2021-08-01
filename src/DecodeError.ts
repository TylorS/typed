/**
 * **This module is experimental**
 *
 * This is a clone of io-ts with support for fp-ts v3
 *
 * A feature tagged as _Experimental_ is in a high state of flux, you're at risk of it changing without notice.
 *
 * @since 0.9.4
 */
import { flow } from 'fp-ts/function'
import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * @category model
 * @since 0.9.4
 */
export interface RequiredKeyE<K, E> {
  readonly _tag: 'RequiredKeyE'
  readonly key: K
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface OptionalKeyE<K, E> {
  readonly _tag: 'OptionalKeyE'
  readonly key: K
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface RequiredIndexE<I, E> {
  readonly _tag: 'RequiredIndexE'
  readonly index: I
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface OptionalIndexE<I, E> {
  readonly _tag: 'OptionalIndexE'
  readonly index: I
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface LazyE<E> {
  readonly _tag: 'LazyE'
  readonly id: string
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface MemberE<M, E> {
  readonly _tag: 'MemberE'
  readonly member: M
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface LeafE<E> {
  readonly _tag: 'LeafE'
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface TagE {
  readonly _tag: 'TagE'
  readonly tag: string
  readonly literals: ReadonlyArray<string>
}

/**
 * @category model
 * @since 0.9.4
 */
export interface TagLE extends LeafE<TagE> {}

/**
 * @category model
 * @since 0.9.4
 */
export interface NullableE<E> {
  readonly _tag: 'NullableE'
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface PrevE<E> {
  readonly _tag: 'PrevE'
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface NextE<E> {
  readonly _tag: 'NextE'
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface MissingIndexesE {
  readonly _tag: 'MissingIndexesE'
  readonly indexes: ReadonlyNonEmptyArray<number>
}

/**
 * @category model
 * @since 0.9.4
 */
export interface UnexpectedIndexesE {
  readonly _tag: 'UnexpectedIndexesE'
  readonly indexes: ReadonlyNonEmptyArray<number>
}

/**
 * @category model
 * @since 0.9.4
 */
export interface SumE<E> {
  readonly _tag: 'SumE'
  readonly error: E
}

/**
 * @category model
 * @since 0.9.4
 */
export interface MessageE {
  readonly _tag: 'MessageE'
  readonly message: string
}

/**
 * @category model
 * @since 0.9.4
 */
export interface MessageLE extends LeafE<MessageE> {}

/**
 * @category model
 * @since 0.9.4
 */
export interface MissingKeysE {
  readonly _tag: 'MissingKeysE'
  readonly keys: ReadonlyNonEmptyArray<string>
}

/**
 * @category model
 * @since 0.9.4
 */
export interface UnexpectedKeysE {
  readonly _tag: 'UnexpectedKeysE'
  readonly keys: ReadonlyNonEmptyArray<string>
}

/**
 * @category model
 * @since 0.9.4
 */
export interface CompoundE<E> {
  readonly _tag: 'CompoundE'
  readonly name: string
  readonly errors: ReadonlyNonEmptyArray<E>
}

/**
 * @category model
 * @since 0.9.4
 */
export interface StringE {
  readonly _tag: 'StringE'
  readonly actual: unknown
}

/**
 * @category model
 * @since 0.9.4
 */
export interface StringLE extends LeafE<StringE> {}

/**
 * @category model
 * @since 0.9.4
 */
export interface NumberE {
  readonly _tag: 'NumberE'
  readonly actual: unknown
}
/**
 * @category model
 * @since 0.9.4
 */
export interface NumberLE extends LeafE<NumberE> {}

/**
 * @category model
 * @since 0.9.4
 */
export interface NaNE {
  readonly _tag: 'NaNE'
}

/**
 * @category model
 * @since 0.9.4
 */
export interface NaNLE extends LeafE<NaNE> {}

/**
 * @category model
 * @since 0.9.4
 */
export interface InfinityE {
  readonly _tag: 'InfinityE'
}

/**
 * @category model
 * @since 0.9.4
 */
export interface InfinityLE extends LeafE<InfinityE> {}

/**
 * @category model
 * @since 0.9.4
 */
export interface BooleanE {
  readonly _tag: 'BooleanE'
  readonly actual: unknown
}

/**
 * @category model
 * @since 0.9.4
 */
export interface BooleanLE extends LeafE<BooleanE> {}

/**
 * @category model
 * @since 0.9.4
 */
export interface UnknownArrayE {
  readonly _tag: 'UnknownArrayE'
  readonly actual: unknown
}

/**
 * @category model
 * @since 0.9.4
 */
export interface UnknownArrayLE extends LeafE<UnknownArrayE> {}

/**
 * @category model
 * @since 0.9.4
 */
export interface UnknownRecordE {
  readonly _tag: 'UnknownRecordE'
  readonly actual: unknown
}
/**
 * @category model
 * @since 0.9.4
 */
export interface UnknownRecordLE extends LeafE<UnknownRecordE> {}

/**
 * @category model
 * @since 0.9.4
 */
export type Literal = string | number | boolean | null | undefined | symbol

/**
 * @category model
 * @since 0.9.4
 */
export interface LiteralE<A extends Literal> {
  readonly _tag: 'LiteralE'
  readonly literals: ReadonlyNonEmptyArray<A>
  readonly actual: unknown
}

/**
 * @category model
 * @since 0.9.4
 */
export interface LiteralLE<A extends Literal> extends LeafE<LiteralE<A>> {}

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * @category constructors
 * @since 0.9.4
 */
export const requiredKeyE = <K, E>(key: K, error: E): RequiredKeyE<K, E> => ({
  _tag: 'RequiredKeyE',
  key,
  error,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const optionalKeyE = <K, E>(key: K, error: E): OptionalKeyE<K, E> => ({
  _tag: 'OptionalKeyE',
  key,
  error,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const requiredIndexE = <I, E>(index: I, error: E): RequiredIndexE<I, E> => ({
  _tag: 'RequiredIndexE',
  index,
  error,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const optionalIndexE = <I, E>(index: I, error: E): OptionalIndexE<I, E> => ({
  _tag: 'OptionalIndexE',
  index,
  error,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const lazyE = <E>(id: string, error: E): LazyE<E> => ({ _tag: 'LazyE', id, error })

/**
 * @category constructors
 * @since 0.9.4
 */
export const memberE = <M, E>(member: M, error: E): MemberE<M, E> => ({
  _tag: 'MemberE',
  member,
  error,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const leafE = <E>(error: E): LeafE<E> => ({ _tag: 'LeafE', error })

/**
 * @category constructors
 * @since 0.9.4
 */
export const tagLE = (tag: string, literals: ReadonlyArray<string>): TagLE =>
  leafE({ _tag: 'TagE', tag, literals })

/**
 * @category constructors
 * @since 0.9.4
 */
export const nullableE = <E>(error: E): NullableE<E> => ({ _tag: 'NullableE', error })

/**
 * @category constructors
 * @since 0.9.4
 */
export const prevE = <E>(error: E): PrevE<E> => ({ _tag: 'PrevE', error })

/**
 * @category constructors
 * @since 0.9.4
 */
export const nextE = <E>(error: E): NextE<E> => ({ _tag: 'NextE', error })

/**
 * @category constructors
 * @since 0.9.4
 */
export const missingIndexesE = (indexes: ReadonlyNonEmptyArray<number>): MissingIndexesE => ({
  _tag: 'MissingIndexesE',
  indexes,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const unexpectedIndexesE = (indexes: ReadonlyNonEmptyArray<number>): UnexpectedIndexesE => ({
  _tag: 'UnexpectedIndexesE',
  indexes,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const sumE = <E>(error: E): SumE<E> => ({
  _tag: 'SumE',
  error,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const messageE = (message: string): MessageE => ({
  _tag: 'MessageE',
  message,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const messageLE: (message: string) => MessageLE = flow(messageE, leafE)

/**
 * @category constructors
 * @since 0.9.4
 */
export const missingKeysE = (keys: ReadonlyNonEmptyArray<string>): MissingKeysE => ({
  _tag: 'MissingKeysE',
  keys,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const unexpectedKeysE = (keys: ReadonlyNonEmptyArray<string>): UnexpectedKeysE => ({
  _tag: 'UnexpectedKeysE',
  keys,
})

/**
 * @category constructors
 * @since 0.9.4
 */
export const compoundE =
  (name: string) =>
  <E>(errors: ReadonlyNonEmptyArray<E>): CompoundE<E> => ({
    _tag: 'CompoundE',
    name,
    errors,
  })

/**
 * @category constructors
 * @since 0.9.4
 */
export const unionE = compoundE('union')

/**
 * @category constructors
 * @since 0.9.4
 */
export const structE = compoundE('struct')

/**
 * @category constructors
 * @since 0.9.4
 */
export const partialE = compoundE('partial')

/**
 * @category constructors
 * @since 0.9.4
 */
export const recordE = compoundE('record')

/**
 * @category constructors
 * @since 0.9.4
 */
export const tupleE = compoundE('tuple')

/**
 * @category constructors
 * @since 0.9.4
 */
export const arrayE = compoundE('array')

/**
 * @category constructors
 * @since 0.9.4
 */
export const compositionE = compoundE('composition')

/**
 * @category constructors
 * @since 0.9.4
 */
export const intersectionE = compoundE('intersection')

/**
 * @category constructors
 * @since 0.9.4
 */
export const stringLE = (actual: unknown): StringLE => leafE({ _tag: 'StringE', actual })

/**
 * @category constructors
 * @since 0.9.4
 */
export const numberLE = (actual: unknown): NumberLE => leafE({ _tag: 'NumberE', actual })

/**
 * @category constructors
 * @since 0.9.4
 */
export const naNLE: NaNLE = leafE({ _tag: 'NaNE' })

/**
 * @category constructors
 * @since 0.9.4
 */
export const infinityLE: InfinityLE = leafE({ _tag: 'InfinityE' })

/**
 * @category constructors
 * @since 0.9.4
 */
export const booleanLE = (actual: unknown): BooleanLE => leafE({ _tag: 'BooleanE', actual })

/**
 * @category constructors
 * @since 0.9.4
 */
export const unknownArrayLE = (actual: unknown): UnknownArrayLE =>
  leafE({
    _tag: 'UnknownArrayE',
    actual,
  })

/**
 * @category constructors
 * @since 0.9.4
 */
export const unknownRecordLE = (actual: unknown): UnknownRecordLE =>
  leafE({
    _tag: 'UnknownRecordE',
    actual,
  })

/**
 * @category constructors
 * @since 0.9.4
 */
export const literalLE = <A extends Literal>(
  actual: unknown,
  literals: ReadonlyNonEmptyArray<A>,
): LiteralLE<A> =>
  leafE({
    _tag: 'LiteralE',
    actual,
    literals,
  })

// -------------------------------------------------------------------------------------
// DecodeError
// -------------------------------------------------------------------------------------

// recursive helpers to please ts@3.5
/**
 * @category model
 * @since 0.9.4
 */
export interface NullableRE<E> extends NullableE<DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface PrevRE<E> extends PrevE<DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface NextRE<E> extends NextE<DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface RequiredKeyRE<E> extends RequiredKeyE<string, DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface OptionalKeyRE<E> extends OptionalKeyE<string, DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface RequiredIndexRE<E> extends RequiredIndexE<string | number, DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface OptionalIndexRE<E> extends OptionalIndexE<number, DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface MemberRE<E> extends MemberE<string | number, DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface LazyRE<E> extends LazyE<DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface SumRE<E> extends SumE<DecodeError<E>> {}
/**
 * @category model
 * @since 0.9.4
 */
export interface CompoundRE<E> extends CompoundE<DecodeError<E>> {}

/**
 * @category model
 * @since 0.9.4
 */
export type DecodeError<E> =
  | UnexpectedKeysE
  | MissingKeysE
  | UnexpectedIndexesE
  | MissingIndexesE
  | LeafE<E>
  | NullableRE<E>
  | PrevRE<E>
  | NextRE<E>
  | RequiredKeyRE<E>
  | OptionalKeyRE<E>
  | RequiredIndexRE<E>
  | OptionalIndexRE<E>
  | MemberRE<E>
  | LazyRE<E>
  | SumRE<E>
  | CompoundRE<E>

/**
 * @category model
 * @since 0.9.4
 */
export type BuiltinE =
  | StringE
  | NumberE
  | BooleanE
  | UnknownRecordE
  | UnknownArrayE
  | LiteralE<Literal>
  | MessageE
  | NaNE
  | InfinityE
  | TagE
