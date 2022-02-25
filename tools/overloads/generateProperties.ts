import { Property } from './AST'
import { Context } from './Context'
import { generateFunctionSignature } from './generateFunctionSignature'

export function generateProperties(
  properties: readonly Property[],
  context: Context,
): readonly Property[] {
  return properties.map((p) => generateProperty(p, context))
}

export function generateProperty(p: Property, context: Context): Property {
  return {
    ...p,
    signature: generateFunctionSignature(p.signature, context),
  }
}
