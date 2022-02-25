import { FunctionSignature, Interface } from './AST'
import { buildContext, Context } from './Context'
import { findPossibilities } from './findPossibilities'
import { generateFunctionSignature } from './generateFunctionSignature'
import { generateInterface } from './generateInterfaceSignature'

export function generateOverloads(
  ast: FunctionSignature | Interface,
): ReadonlyArray<readonly [FunctionSignature | Interface, Context]> {
  switch (ast.tag) {
    case FunctionSignature.tag:
      return generateFunctionSignatureOverloads(ast).reverse()
    case Interface.tag:
      return generateInterfaceOverloads(ast)
  }
}

export function generateFunctionSignatureOverloads(signature: FunctionSignature) {
  return findPossibilities(signature).map((possiblilty) => {
    const context = buildContext(signature, possiblilty)

    return [generateFunctionSignature(signature, context), context] as const
  })
}

export function generateInterfaceOverloads(node: Interface) {
  // TODO: Generate curried interfaces
  return findPossibilities(node).map((possiblilty) => {
    const context = buildContext(node, possiblilty)

    return [generateInterface(node, context), context] as const
  })
}
