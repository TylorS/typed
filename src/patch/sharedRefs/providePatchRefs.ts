import { Effect } from '@typed/fp/Effect/Effect'
import { HookEnvironment } from '@typed/fp/hooks/exports'
import { OpEnvs } from '@typed/fp/Op/exports'
import { createFifoQueue } from '@typed/fp/Queue/exports'
import { provideSharedRef } from '@typed/fp/SharedRef/exports'
import { pipe } from 'fp-ts/function'

import { EffectQueue } from './EffectQueue'
import { RenderablesEnvs } from './RenderableEnvs'
import { RenderedEnvs } from './RenderedEnvs'
import { RendererEnvs } from './RendererEnvs'
import { RenderQueue } from './RenderQueue'
import { UpdatedEnvs } from './UpdatedEnvs'
import { UpdatingEnvs } from './UpdatingEnvs'

export const PatchRefEnvs = [
  EffectQueue,
  RenderablesEnvs,
  RenderedEnvs,
  RendererEnvs,
  RenderQueue,
  UpdatedEnvs,
  UpdatingEnvs,
] as const

export type PatchRefEnvs = OpEnvs<typeof PatchRefEnvs>

export const providePatchRefs = <E, A>(eff: Effect<E & PatchRefEnvs, A>): Effect<E, A> =>
  pipe(
    eff,
    provideSharedRef(EffectQueue, createFifoQueue<readonly [Effect<any, any>, any]>([])),
    provideSharedRef(RenderablesEnvs, new Map()),
    provideSharedRef(RenderedEnvs, new Map()),
    provideSharedRef(RendererEnvs, new Map()),
    provideSharedRef(RenderQueue, createFifoQueue<HookEnvironment>([])),
    provideSharedRef(UpdatedEnvs, new Set()),
    provideSharedRef(UpdatingEnvs, new Set()),
  )
