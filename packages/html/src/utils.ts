export function isComment(node: Node): node is Comment {
  return node.nodeType === node.COMMENT_NODE
}

export function isCommentWithValue(node: Node, value: string): node is Comment {
  return isComment(node) && node.nodeValue === value
}

export function isHtmlElement(node: Node): node is HTMLElement {
  return node.nodeType === node.ELEMENT_NODE
}
