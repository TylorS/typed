import { Tagged } from "@typed/context"
import type { Template } from "../Template.js"
import type { ParentChildNodes } from "./utils.js"

/**
 * Used Internally to pass context down to components for hydration
 * @internal
 */
export type HydrateContext = {
  readonly where: ParentChildNodes
  readonly rootIndex: number
  readonly parentTemplate: Template | null

  // Used to match sibling components using many() to the correct elements
  readonly manyIndex?: string

  /**@internal */
  hydrate: boolean
}

/**
 * Used Internally to pass context down to components for hydration
 * @internal
 */
export const HydrateContext = Tagged<HydrateContext>("@typed/html/HydrateContext")
