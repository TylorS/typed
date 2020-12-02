import { Uuid } from '@typed/fp/Uuid/exports'
import { Const } from 'fp-ts/Const'
import { Iso } from 'monocle-ts'
import { iso, Newtype } from 'newtype-ts'

/**
 * A Newtype for representing Keys for a given type.
 * @example
 * type FooKey = Key<Foo>
 * type Foo = { id: FooKey, ... }
 */
export interface Key<A> extends Newtype<Const<A, KeyBrand>, string> {}

/**
 * An Isomorphism for a Key<A> and a string
 */
export interface KeyIso<A> extends Iso<Key<A>, string> {}

/**
 * Create an KeyIso<A>
 */
export const getKeyIso = <A>(): KeyIso<A> => iso<Key<A>>()

/**
 * A Newtype for representing Keys that are Uuids for a given type.
 * @example
 * type FooKey = UuidKey<Foo>
 * type Foo = { id: FooKey, ... }
 */
export interface UuidKey<A> extends Newtype<Const<A, KeyBrand>, Uuid> {}

/**
 * An Isomorphism for a UuidKey<A> and a Uuid
 */
export interface UuidKeyIso<A> extends Iso<UuidKey<A>, Uuid> {}

/**
 * Create a UuidKeyIso<A>
 */
export const getUuidKeyIso = <A>(): UuidKeyIso<A> => iso<UuidKey<A>>()

export type KeyBrand = 'Key'

/**
 * Retrieve the value a given Key is For
 */
export type KeyFor<A> = A extends Newtype<Const<infer R, any>, any> ? R : never
