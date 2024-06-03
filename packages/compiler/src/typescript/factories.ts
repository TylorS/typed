/**
 * Factory functiosn for creating TypeScript AST nodes
 *
 * @since 1.0.0
 */

import * as ts from "typescript"

/**
 * Creates a TypeScript variable declaration
 * @since 1.0.0
 */
export function createVariableDeclaration(
  name: string,
  type?: ts.TypeNode,
  initializer?: ts.Expression
): ts.VariableDeclaration {
  return ts.factory.createVariableDeclaration(ts.factory.createIdentifier(name), undefined, type, initializer)
}

/**
 * Creates a TypeScript function call
 * @since 1.0.0
 */
export function createFunctionCall(name: string, args: Array<ts.Expression>): ts.CallExpression {
  return ts.factory.createCallExpression(ts.factory.createIdentifier(name), undefined, args)
}

/**
 * Creates a TypeScript method call
 * @since 1.0.0
 */
export function createMethodCall(
  object: string,
  methodName: string,
  typeParams: Array<ts.TypeNode>,
  args: Array<ts.Expression>
): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(object), methodName),
    typeParams,
    args
  )
}

/**
 * Creates a TypeScript type reference by name
 * @since 1.0.0
 */
export function createTypeReference(name: string, ...args: Array<ts.TypeNode>): ts.TypeReferenceNode {
  return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(name), args)
}

/**
 * Creates a TypeScript union types by name
 * @since 1.0.0
 */
export function createUnion(types: Array<ts.TypeNode>): ts.TypeNode {
  if (types.length === 0) return createTypeReference("never")
  if (types.length === 1) return types[0]
  return ts.factory.createUnionTypeNode(types)
}

/**
 * `Element` type reference
 * @since 1.0.0
 */
export const ElementType = createTypeReference("Element")

/**
 * `Text` type reference
 * @since 1.0.0
 */
export const TextType = createTypeReference("Text")

/**
 * `Node` type reference
 * @since 1.0.0
 */
export const NodeType = createTypeReference("Node")

/**
 * `Document` type reference
 * @since 1.0.0
 */
export const DocumentType = createTypeReference("Document")

/**
 * `DocumentFragment` type reference
 * @since 1.0.0
 */
export const DocumentFragmentType = createTypeReference("DocumentFragment")

/**
 * `HTMLElement` type reference
 * @since 1.0.0
 */
export const HTMLElementType = createTypeReference("HTMLElement")

/**
 * `SVGElement` type reference
 * @since 1.0.0
 */
export const SVGElementType = createTypeReference("SVGElement")

/**
 * Create document fragment
 * @since 1.0.0
 */
export function createDocumentFragment() {
  return createMethodCall("document", "createDocumentFragment", [], [])
}

/**
 * Create element
 * @since 1.0.0
 */
export function createElement(tagName: string) {
  return createMethodCall("document", "createElement", [], [ts.factory.createStringLiteral(tagName)])
}

/**
 * Create text node
 * @since 1.0.0
 */
export function createText(text: string) {
  return createMethodCall("document", "createTextNode", [], [ts.factory.createStringLiteral(text)])
}

/**
 * Append child
 * @since 1.0.0
 */
export function appendChild(parent: string, child: string) {
  return createMethodCall(parent, "appendChild", [], [ts.factory.createIdentifier(child)])
}

/**
 * Remove child
 * @since 1.0.0
 */
export function removeChild(parent: string, child: string) {
  return createMethodCall(parent, "removeChild", [], [ts.factory.createIdentifier(child)])
}

/**
 * Insert before
 * @since 1.0.0
 */
export function insertBefore(parent: string, child: string, reference?: string | null) {
  return createMethodCall(parent, "insertBefore", [], [
    ts.factory.createIdentifier(child),
    ...(reference ? [ts.factory.createIdentifier(reference)] : [])
  ])
}

export function createConst(varName: string, expression: ts.Expression): ts.Statement {
  return ts.factory.createVariableStatement(
    [],
    ts.factory.createVariableDeclarationList(
      [createVariableDeclaration(varName, undefined, expression)],
      ts.NodeFlags.Const
    )
  )
}

export function createEffectYield(expression: ts.Expression): ts.Expression {
  return ts.factory.createYieldExpression(
    ts.factory.createToken(ts.SyntaxKind.AsteriskToken),
    ts.factory.createCallExpression(ts.factory.createIdentifier("_"), [], [expression])
  )
}

export function setAttribute(element: string, name: string, value: string) {
  return createMethodCall(element, "setAttribute", [], [
    ts.factory.createStringLiteral(name),
    ts.factory.createCallExpression(ts.factory.createIdentifier(`String`), [], [ts.factory.createStringLiteral(value)])
  ])
}

export function toggleAttribute(element: string, name: string) {
  return createMethodCall(element, "toggleAttribute", [], [
    ts.factory.createStringLiteral(name),
    ts.factory.createTrue()
  ])
}
