import { Chain2 } from 'fp-ts/Chain'
import { identity } from 'fp-ts/function'

import { Chain, FromReader, URI } from '../Env'
import { FromEnv2 } from '../FromEnv'
import * as FR from './Ref'

const E: FromEnv2<URI> & Chain2<URI> = {
  fromEnv: identity,
  ...Chain,
}

export const createRef = FR.createRef<URI>()
export const fromKey = FR.fromKey(FromReader)
export const getRef = FR.getRef(E)
export const setRef = FR.setRef(E)
export const deleteRef = FR.setRef(E)
