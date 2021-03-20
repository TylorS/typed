import * as S from '@typed/fp/Shared'
import { Chain, FromReader } from 'fp-ts/dist/Reader'

import { FromIO } from './fromIO'
import { MonadReader } from './MonadReader'
import { UseSome } from './provide'

export const getOrCreateNamespace = S.createGetOrCreateNamespace({ ...MonadReader, ...FromIO })
export const sendSharedEvent = S.createSendSharedEvent({ ...FromReader, ...FromIO, ...Chain })
export const runWithNamespace = S.runWithNamespace({ ...MonadReader, ...FromIO, ...UseSome })
