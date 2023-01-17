import type { Main } from '@typed/framework'

import { layer } from '../../components/counter-with-service.js'

// Environment.ts files are utilized much like layouts and will apply to all pages adjacent or descendant
// to the environment.ts file unless overriden in the a sub-directory's environment.ts file. If the page
// defines its own local environment, they will both be provided.
export const environment: Main.LayerOf<typeof import('./bar.js').main> = layer('Counter')
