import { HKTParam, Interface } from './AST'
import { Context } from './Context'
import { findHKTParams } from './findHKTParams'
import { generateProperties } from './generateProperties'
import { generateTypeParams } from './generateTypeParams'

export function generateInterface(node: Interface, context: Context) {
  return new Interface(
    generateInterfaceName(node, context),
    generateTypeParams(node.typeParams, context),
    generateProperties(node.properties, context),
  )
}

function generateInterfaceName(node: Interface, context: Context): string {
  return `${node.name}${generatePostfix(findHKTParams(node.typeParams), context)}`
}

function generatePostfix(hktParams: readonly HKTParam[], context: Context) {
  return hktParams
    .map((p) => `${context.lengths.get(p.id) === 0 ? '' : context.lengths.get(p.id) ?? ''}`)
    .join('')
}
