import { Uuid } from '@typed/fp/Uuid/exports'
import { Const } from 'fp-ts/Const'
import { Iso } from 'monocle-ts'
import { iso, Newtype } from 'newtype-ts'

export interface Key<A> extends Newtype<Const<{ readonly Key: unique symbol }, A>, string> {}

export interface KeyIso<A> extends Iso<Key<A>, string> {}

export const getKeyIso = <A>(): KeyIso<A> => iso<Key<A>>()

export interface UuidKey<A> extends Newtype<Const<{ readonly key: unique symbol }, A>, Uuid> {}

export interface UuidKeyIso<A> extends Iso<UuidKey<A>, Uuid> {}

export const getUuidKeyIso = <A>(): UuidKeyIso<A> => iso<UuidKey<A>>()
