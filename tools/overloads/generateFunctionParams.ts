import {
  DynamicFunctionParam,
  FunctionParam,
  FunctionSignature,
  Kind,
  StaticFunctionParam,
  Typeclass,
} from './AST'
import { Context } from './Context'
// eslint-disable-next-line import/no-cycle
import { generateFunctionSignature } from './generateFunctionSignature'
import { generateKind } from './generateKindParams'
import { generateTypeclass, generateTypeParams } from './generateTypeParams'

export function generateFunctionParams(
  params: readonly FunctionParam[],
  context: Context,
): readonly FunctionParam[] {
  return params.flatMap((p) => generateFunctionParam(p, context))
}

export function generateFunctionParam(
  param: FunctionParam,
  context: Context,
): readonly FunctionParam[] {
  switch (param.tag) {
    case Kind.tag:
      return [generateKind(param, context)]
    case StaticFunctionParam.tag:
      return [param]
    case DynamicFunctionParam.tag:
      return [generateDynamicFunctionParam(param, context)]
    case Typeclass.tag:
      return [generateTypeclass(param, context)]
    case FunctionSignature.tag:
      return [generateFunctionSignature(param, context)]
  }
}

function generateDynamicFunctionParam(
  param: DynamicFunctionParam,
  context: Context,
): DynamicFunctionParam {
  return {
    ...param,
    typeParams: generateTypeParams(param.typeParams, context),
  }
}
