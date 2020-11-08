import { createSchema } from '@typed/fp/io/exports'
import { flow } from 'fp-ts/function'
import { some } from 'fp-ts/Option'
import { iso, Newtype } from 'newtype-ts'

/**
 * A key used to index a Shared value.
 */
export interface SharedKey<K extends PropertyKey = PropertyKey> extends Newtype<'SharedKey', K> {}

export namespace SharedKey {
  export const { wrap, unwrap } = iso<SharedKey>()

  export const schema = createSchema((t) => t.newtype(t.propertyKey, flow(wrap, some), 'SharedKey'))
}
