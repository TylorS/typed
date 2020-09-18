import { Uuid } from '@typed/fp/Uuid/exports'
import { Iso } from 'monocle-ts'
import { iso, Newtype } from 'newtype-ts'

export interface Key<A> extends Newtype<{ readonly key: unique symbol; readonly for: A }, string> {}

export const getKeyIso = <A>(): Iso<Key<A>, string> => iso<Key<A>>()

export interface UuidKey<A>
  extends Newtype<{ readonly key: unique symbol; readonly for: A }, Uuid> {}

export const getUuidKeyIso = <A>(): Iso<UuidKey<A>, Uuid> => iso<UuidKey<A>>()
