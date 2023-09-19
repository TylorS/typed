/**
 * Navigation is an Effect-based workflow for working with the browser's Navigation API.
 * @since 1.0.0
 */
import * as Context from "@typed/context"

/**
 * @since 1.0.0
 * @category models
 */
export interface Navigation {}

/**
 * @since 1.0.0
 * @category context
 */
export const Navigation: Context.Tagged<Navigation> = Context.Tagged<Navigation>(
  "@typed/navigation/Navigation"
)
