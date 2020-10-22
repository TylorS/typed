import { Uuid } from '@typed/fp/Uuid/exports'
import { Const } from 'fp-ts/Const'
import { Iso } from 'monocle-ts'
import { iso, Newtype } from 'newtype-ts'

export interface Key<A> extends Newtype<Const<KeyBrand, A>, string> {}

export interface KeyIso<A> extends Iso<Key<A>, string> {}

export const getKeyIso = <A>(): KeyIso<A> => iso<Key<A>>()

export interface UuidKey<A> extends Newtype<Const<KeyBrand, A>, Uuid> {}

export interface UuidKeyIso<A> extends Iso<UuidKey<A>, Uuid> {}

export const getUuidKeyIso = <A>(): UuidKeyIso<A> => iso<UuidKey<A>>()

export type KeyBrand = { readonly Key: unique symbol }

export type KeyFor<A> = A extends Newtype<Const<unknown, infer R>, any> ? R : never
