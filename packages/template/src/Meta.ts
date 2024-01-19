/**
 * @since 1.0.0
 */

// Used to mark where the typed templates are in the html.
/**
 * @since 1.0.0
 */
export const TYPED_START = `<!--typed-start-->`
/**
 * @since 1.0.0
 */
export const TYPED_END = `<!--typed-end-->`

/**
 * @since 1.0.0
 */
export const TYPED_HASH = (hash: string) => `data-typed="${hash}"`

// Inserted into the html to mark where the text starts and ensure separate
// text nodes are created.
/**
 * @since 1.0.0
 */
export const TEXT_START = "<!--text-->"

// Used to mark where a NodePart is in the DOM. It can be found directly after the
// elements or text nodes it is managing.
/**
 * @since 1.0.0
 */
export const TYPED_HOLE = (index: number) => `<!--hole${index}-->`

/**
 * Used to mark separation between the start and end of a template.
 * @since 1.0.0
 */
export const MANY_HOLE = (key: PropertyKey) => `<!--many${key.toString()}-->`
