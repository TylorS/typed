import { Tagged } from "@typed/context"
import type { ParentChildNodes } from "@typed/template/internal/utils"
import type { Template } from "@typed/template/Template"

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
export const HydrateContext = Tagged<HydrateContext>("@typed/html/HydrateContext")
