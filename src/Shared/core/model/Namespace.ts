import { createSchema } from '@typed/fp/io/exports'
import { flow } from 'fp-ts/function'
import { some } from 'fp-ts/Option'
import { iso, Newtype } from 'newtype-ts'

/**
 * A Namespace is a keyspace in which to store an isolated set of Shared keys to Shared values.
 */
export interface Namespace extends Newtype<'Namespace', PropertyKey> {}

export namespace Namespace {
  export const { wrap, unwrap } = iso<Namespace>()

  export const schema = createSchema((t) => t.newtype(t.propertyKey, flow(wrap, some), 'Namespace'))
}
