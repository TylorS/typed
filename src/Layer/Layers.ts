import { Fiber } from '@/Fiber'
import { fromIO } from '@/Fx'
import { global } from '@/Ref'

import { LayerId } from './Layer'

export const Layers = global(fromIO(() => new Map<LayerId, Fiber<any, any>>(), 'CreateLayers'))
