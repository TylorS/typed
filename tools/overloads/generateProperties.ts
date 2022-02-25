import { InterfaceProperty } from './AST'
import { Context } from './Context'
import { generateFunctionSignature } from './generateFunctionSignature'

export function generateProperties(
  properties: readonly InterfaceProperty[],
  context: Context,
): readonly InterfaceProperty[] {
  return properties.map((p) => generateProperty(p, context))
}

export function generateProperty(p: InterfaceProperty, context: Context): InterfaceProperty {
  return {
    ...p,
    signature: generateFunctionSignature(p.signature, context),
  }
}
