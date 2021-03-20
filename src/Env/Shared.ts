import * as S from '@typed/fp/Shared'

import { Chain, FromIO, FromReader, MonadReader, UseSome } from './fp-ts'

export const getOrCreateNamespace = S.createGetOrCreateNamespace({ ...MonadReader, ...FromIO })
export const sendSharedEvent = S.createSendSharedEvent({ ...FromReader, ...FromIO, ...Chain })
export const runWithNamespace = S.runWithNamespace({ ...MonadReader, ...FromIO, ...UseSome })
