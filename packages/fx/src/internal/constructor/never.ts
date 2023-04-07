import { BaseFx } from '@typed/fx/internal/BaseFx'
import { Effect } from '@typed/fx/internal/externals'

export class NeverFx extends BaseFx<never, never, never> {
  readonly name = 'Never' as const

  constructor() {
    super()
  }

  run() {
    return Effect.never()
  }
}

export const never = new NeverFx()
