import { Uuid } from '@typed/fp/Uuid/exports'
import { Const } from 'fp-ts/Const'
import { Iso } from 'monocle-ts'
import { iso, Newtype } from 'newtype-ts'

export interface Key<A> extends Newtype<{ readonly Key: unique symbol }, Const<string, A>> {}

export const getKeyIso = <A>(): Iso<Key<A>, Const<string, A>> => iso<Key<A>>()

export interface UuidKey<A> extends Newtype<{ readonly key: unique symbol }, Const<Uuid, A>> {}

export const getUuidKeyIso = <A>(): Iso<UuidKey<A>, Const<Uuid, A>> => iso<UuidKey<A>>()
