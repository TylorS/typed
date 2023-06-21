// Used to mark where the typed templates are in the html.
export const TYPED_START = `<!--typed-start-->`
export const TYPED_END = `<!--typed-end-->`

export const TYPED_HASH = (hash: string) => `data-typed="${hash}"`

// Inserted into the html to mark where the text starts and ensure separate
// text nodes are created.
export const TEXT_START = '<!--text-->'

// Inserted into the html to mark where in the DOM an attribute with a given
// part index is. It can be found at the start of the elements body.
export const TYPED_ATTR = (index: number) => `<!--attr${index}-->`

// Used to mark where a NodePart is in the DOM. It can be found directly after the
// elements or text nodes it is managing.
export const TYPED_HOLE = (index: number) => `<!--hole${index}-->`

export const TYPED_SELF_CLOSING_START = (hash?: string) =>
  hash ? `<!--sx-${hash}-->` : '<!--sx-->'
export const TYPED_SELF_CLOSING_END = (hash?: string) =>
  hash ? `<!--/sx-${hash}-->` : '<!--/sx-->'
