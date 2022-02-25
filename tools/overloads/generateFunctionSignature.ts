import { FunctionReturnSignature, FunctionSignature, KindReturn } from './AST'
import { Context } from './Context'
import { generateFunctionParams } from './generateFunctionParams'
import { generateKindReturn } from './generateKindReturn'
import { generateTypeParams } from './generateTypeParams'

export function generateFunctionSignature(signature: FunctionSignature, context: Context) {
  return new FunctionSignature(
    signature.name,
    generateTypeParams(signature.typeParams, context),
    generateFunctionParams(signature.functionParams, context),
    generateReturnSignature(signature.returnSignature, context),
  )
}

export function generateReturnSignature(
  signature: FunctionReturnSignature,
  context: Context,
): FunctionReturnSignature {
  switch (signature.tag) {
    case FunctionSignature.tag:
      return generateFunctionSignature(signature, context)
    case KindReturn.tag:
      return generateKindReturn(signature, context)
    default:
      return signature
  }
}
