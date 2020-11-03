import { Effect } from '@typed/fp/Effect/exports'

import { NamespaceKeyStores } from '../model/exports'
import { SharedEnv } from '../SharedEnv'
import { getShared } from './getShared'

export const getKeyStores: Effect<SharedEnv, NamespaceKeyStores> = getShared(NamespaceKeyStores)
