import * as ts from "typescript"

export function createVariableDeclaration(
  name: string,
  type?: ts.TypeNode,
  initializer?: ts.Expression
): ts.VariableDeclaration {
  return ts.factory.createVariableDeclaration(ts.factory.createIdentifier(name), undefined, type, initializer)
}

export function createFunctionCall(name: string, args: Array<ts.Expression>): ts.CallExpression {
  return ts.factory.createCallExpression(ts.factory.createIdentifier(name), undefined, args)
}

export function createMethodCall(object: string, methodName: string, args: Array<ts.Expression>): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(object), methodName),
    undefined,
    args
  )
}

export function createTypeReference(name: string, ...args: Array<ts.TypeNode>): ts.TypeReferenceNode {
  return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(name), args)
}

export const ElementType = createTypeReference("Element")
export const TextType = createTypeReference("Text")
export const NodeType = createTypeReference("Node")
export const DocumentType = createTypeReference("Document")
export const DocumentFragmentType = createTypeReference("DocumentFragment")
export const HTMLElementType = createTypeReference("HTMLElement")
export const SVGElementType = createTypeReference("SVGElement")

export function createDocumentFragment() {
  return createMethodCall("document", "createDocumentFragment", [])
}

export function createElement(tagName: string) {
  return createMethodCall("document", "createElement", [ts.factory.createStringLiteral(tagName)])
}

export function createText(text: string) {
  return createMethodCall("document", "createTextNode", [ts.factory.createStringLiteral(text)])
}

export function appendChild(parent: string, child: string) {
  return createMethodCall(parent, "appendChild", [ts.factory.createIdentifier(child)])
}

export function removeChild(parent: string, child: string) {
  return createMethodCall(parent, "removeChild", [ts.factory.createIdentifier(child)])
}

export function insertBefore(parent: string, child: string, reference?: string | null) {
  return createMethodCall(parent, "insertBefore", [
    ts.factory.createIdentifier(child),
    ...(reference ? [ts.factory.createIdentifier(reference)] : [])
  ])
}
