import { Tag } from '@typed/context'

import { Template } from '../parser/parser.js'
import { ParentChildNodes } from '../paths.js'

/**
 * Used Internally to pass context down to components for hydration
 * @internal
 */
export type HydrateContext = {
  readonly where: ParentChildNodes
  readonly rootIndex: number
  readonly parentTemplate: Template | null
  readonly childIndex?: number

  /**@internal */
  hydrate: boolean
}

/**
 * Used Internally to pass context down to components for hydration
 * @internal
 */
export const HydrateContext = Tag<HydrateContext>('@typed/html/HydrateContext')
