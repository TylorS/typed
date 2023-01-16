import type { Main } from '@typed/framework'

import { layer } from '../../components/counter-with-service.js'

export const environment: Main.LayerOf<typeof import('./bar.js').main> = layer('Counter')
