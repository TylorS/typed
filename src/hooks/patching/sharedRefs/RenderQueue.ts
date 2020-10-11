import { SharedQueue, wrapSharedQueue } from '@typed/fp/Queue/exports'
import { createSharedRef } from '@typed/fp/SharedRef/exports'

import { HookEnvironment } from '../../core/exports'

export const RENDER_QUEUE = '@typed/fp/hooks/RenderQueue'
export type RENDER_QUEUE = typeof RENDER_QUEUE

export interface RenderQueue extends SharedQueue<RENDER_QUEUE, HookEnvironment> {}

export const RenderQueue = createSharedRef<RenderQueue>(RENDER_QUEUE)

export const renderQueue = wrapSharedQueue(RenderQueue)
