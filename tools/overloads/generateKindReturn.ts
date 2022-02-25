import { KindReturn } from './AST'
import { Context } from './Context'
import { generateKindParams } from './generateKindParams'

export function generateKindReturn(kind: KindReturn, context: Context): KindReturn {
  return {
    ...kind,
    typeParams: generateKindParams(kind.typeParams, context),
  }
}
