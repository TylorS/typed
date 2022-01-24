import { Branded } from '@/Branded'
import { Fx } from '@/Fx'

export interface Layer<R, E, S> {
  readonly id: LayerId
  readonly provider: Fx<R, E, S>
}

export type LayerId = Branded<PropertyKey, 'LayerId'>
export const LayerId = Branded<LayerId>()
