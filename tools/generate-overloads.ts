import { Params } from '@/Prelude/HKT'

import { DeepEquals } from '../src/Prelude/Eq'
import {
  DynamicValue,
  FunctionArgument,
  FunctionSignature,
  HktReturnSignature,
  HktReturnSignatureParam,
  HktTypeParam,
  InterfaceNode,
  KindNode,
  possibleLengths,
  RecordNode,
  ReturnSignature,
  StaticTypeParam,
  TupleNode,
  TypeClassArgument,
  TypeParam,
  Value,
} from './OverloadAst'

const hktParamNames = [
  Params.A,
  Params.E,
  Params.R,
  Params.S,
  Params.U,
  Params.V,
  Params.W,
  Params.X,
  Params.Y,
  Params.Z,
] as const

export function generateOverloads(node: FunctionSignature | InterfaceNode) {
  switch (node.tag) {
    case 'FunctionSignature':
      return generateFunctionSignatures(node)
        .map((x) => printFunctionSignature(x))
        .join('\n\n')
    case 'InterfaceNode':
      return uniq(generateInterfaceNodes(node).map((x) => printInterfaceNode(x))).join('\n\n')
  }
}

export function generateInterfaceNodes(node: InterfaceNode): readonly InterfaceNode[] {
  const hktParams = node.params.filter((x): x is HktTypeParam => x.tag === 'HktTypeParam')
  const possiblilties = uniq(combinations<number>(hktParams.map(() => possibleLengths)))

  return possiblilties.map((possibility) => rewriteInterfaceNode(node, possibility))
}

export function generateFunctionSignatures(signature: FunctionSignature) {
  const hktParams = signature.params.filter((x): x is HktTypeParam => x.tag === 'HktTypeParam')
  const possiblilties = uniq(combinations<number>(hktParams.map(() => possibleLengths)))

  return possiblilties.map((possibility) => rewriteFunctionSignature(signature, possibility))
}

function uniq<A>(array: ReadonlyArray<A>): ReadonlyArray<A> {
  const seen: A[] = []
  const unique: A[] = []

  for (const value of array) {
    if (seen.find(DeepEquals.equals(value))) {
      continue
    }

    seen.push(value)
    unique.push(value)
  }

  return unique
}

function rewriteInterfaceNode(
  node: InterfaceNode,
  possibleLengths: ReadonlyArray<number>,
  lengths: Map<symbol, number> = new Map(),
): InterfaceNode {
  let i = 0
  const shouldSetLengths = lengths.size === 0

  const params = node.params.map((x) => {
    if (x.tag !== 'HktTypeParam') {
      return x
    }

    const index = i++
    const size = shouldSetLengths ? possibleLengths[index] : lengths.get(x.id)!

    lengths.set(x.id, size)

    return { ...x, size }
  })

  const kindNodes = node.properties
    .filter((x): x is readonly [string, KindNode] => x[1].tag === 'KindNode')
    .map((x) => x[1])

  const { additionalParams, setAdditional } = getAdditionalParams(
    lengths,
    node.useDefaults,
    node.reverse,
  )

  kindNodes.forEach((node, i) =>
    setAdditional(node.hkt, node.params, i, kindNodes.length > 1, node.existing),
  )

  return new InterfaceNode(
    node.name,
    params,
    node.properties.map(
      ([k, v]) =>
        [
          k,
          v.tag === 'FunctionSignature'
            ? rewriteFunctionSignature(v, possibleLengths, lengths)
            : v.tag === 'DynamicValue'
            ? v
            : rewriteKindNode(v, lengths, node.reverse, additionalParams),
        ] as const,
    ),
  )
}

function rewriteFunctionSignature(
  signature: FunctionSignature,
  possibleLengths: ReadonlyArray<number>,
  lengths: Map<symbol, number> = new Map(),
): FunctionSignature {
  let i = 0
  const shouldSetLengths = lengths.size === 0
  const params = signature.params.map((x) => {
    if (x.tag !== 'HktTypeParam') {
      return x
    }

    const size = shouldSetLengths ? possibleLengths[i++] : lengths.get(x.id)!

    lengths.set(x.id, size)

    return { ...x, size }
  })

  const kindNodes = findKindNodes(signature.args)

  const { additionalParams, setAdditional } = getAdditionalParams(
    lengths,
    signature.useDefaults,
    signature.reverse,
  )

  kindNodes.forEach((node, i) =>
    setAdditional(node.hkt, node.params, i, kindNodes.length > 1, node.existing),
  )

  if (signature.returnSignature.tag === 'HktReturnSignature') {
    setAdditional(
      signature.returnSignature.type,
      signature.params,
      kindNodes.length === 0 ? 0 : kindNodes.length + 1,
      kindNodes.length > 1,
      signature.returnSignature.params.length,
    )
  }

  const args = signature.args.map((x) => {
    switch (x.tag) {
      case 'KindNode':
        return rewriteKindNode(x, lengths, signature.reverse, additionalParams)
      case 'TypeClassArgument':
        return rewriteTypeClassArgument(x, lengths)
      default:
        return x
    }
  })

  const returnSignature = rewriteReturnSignature(
    signature.returnSignature,
    possibleLengths,
    lengths,
    additionalParams,
  )

  return {
    ...signature,
    params: signature.reverse
      ? [...params, ...Array.from(additionalParams.values()).flat()]
      : [...Array.from(additionalParams.values()).flat(), ...params],
    args,
    returnSignature,
  }
}

function rewriteKindNode(
  x: KindNode,
  lengths: Map<symbol, number>,
  reverse: boolean,
  additionalParams: Map<symbol, readonly StaticTypeParam[]>,
): KindNode {
  return addAdditionalKindNodeParams(
    {
      ...x,
      params: x.params.map((y) =>
        y.tag === 'KindNode' ? rewriteKindNode(y, lengths, reverse, additionalParams) : y,
      ),
      size: lengths.get(x.hkt.id)!,
    },
    reverse,
    additionalParams,
  )
}

function addAdditionalKindNodeParams(
  x: KindNode,
  reverse: boolean,
  additionalParams: Map<symbol, readonly StaticTypeParam[]>,
): KindNode {
  return {
    ...x,
    params: reverse
      ? [...x.params, ...(additionalParams.get(x.hkt.id) ?? []).slice().reverse()]
      : [...(additionalParams.get(x.hkt.id) ?? []).slice().reverse(), ...x.params],
  }
}

function findKindNodes(args: readonly FunctionArgument[]): readonly KindNode[] {
  return args.flatMap((arg) =>
    arg.tag === 'KindNode'
      ? [arg, ...findKindNodes(arg.params.filter((x): x is KindNode => x.tag === 'KindNode'))]
      : [],
  )
}

function rewriteTypeClassArgument(
  x: TypeClassArgument,
  lengths: Map<symbol, number>,
): TypeClassArgument {
  const hktParam = x.typeParams.find((x): x is HktTypeParam => x.tag === 'HktTypeParam')
  const size = hktParam ? lengths.get(hktParam.id)! : x.size

  return { ...x, size }
}

function rewriteReturnSignature(
  signature: ReturnSignature,
  possibleLengths: ReadonlyArray<number>,
  lengths: Map<symbol, number>,
  additionalParams: Map<symbol, readonly StaticTypeParam[]>,
): ReturnSignature {
  switch (signature.tag) {
    case 'FunctionSignature':
      return rewriteFunctionSignature(signature, possibleLengths, lengths)
    case 'HktReturnSignature':
      return rewriteHktReturnSignature(signature, lengths, additionalParams)
    default:
      return signature
  }
}

function rewriteHktReturnSignature(
  x: HktReturnSignature,
  lengths: Map<symbol, number>,
  additionalParams: Map<symbol, readonly StaticTypeParam[]>,
): HktReturnSignature {
  return addAdditionalHktReturnParams(
    {
      ...x,
      params: x.params.map((y) =>
        y.tag === 'HktReturnSignature'
          ? rewriteHktReturnSignature(y, lengths, additionalParams)
          : y,
      ),
      size: lengths.get(x.type.id)!,
    },
    additionalParams,
  )
}

function addAdditionalHktReturnParams(
  x: HktReturnSignature,
  additionalParams: Map<symbol, readonly StaticTypeParam[]>,
) {
  return {
    ...x,
    params: [...(additionalParams.get(x.type.id) ?? []), ...x.params],
  }
}

function combinations<A>(
  options: ReadonlyArray<ReadonlyArray<A>>,
): ReadonlyArray<ReadonlyArray<A>> {
  const inputs = options.slice()

  if (inputs.length === 1) {
    return inputs[0].map((x) => [x] as const)
  }

  const possiblilties: Array<ReadonlyArray<A>> = []

  while (inputs.length > 1) {
    const current = inputs.shift()!
    const next = inputs.shift()!

    const combined = next.reduce((acc: ReadonlyArray<ReadonlyArray<A>>, x) => {
      return acc.concat(current.map((h) => [h, x]))
    }, [])

    possiblilties.push(...combined)
  }

  return possiblilties
}

function printFunctionSignature(signature: FunctionSignature, isReturn = false) {
  let str = ''

  if (!isReturn && signature.exported) {
    str += 'export '
  }

  if (!isReturn) {
    str += 'function '
  }

  str += `${signature.name}`

  str +=
    signature.params.length === 0
      ? ''
      : `<${signature.params.map((param) => printTypeParam(param)).join(', ')}>`

  str += '('

  str += signature.args.map((arg) => printArgument(arg)).join(', ')

  str += `)${!isReturn && signature.returnSignature.tag === 'FunctionSignature' ? ':' : ' =>'} `

  str += printReturnSignature(signature.returnSignature)

  return str
}

function printTypeParam(param: TypeParam, printExtension = true): string {
  let str = ''

  str += param.label

  switch (param.tag) {
    case 'StaticTypeParam': {
      if (printExtension && param.extension) {
        str += ` ${param.extension.startsWith('=') ? '' : 'extends '}${param.extension}`
      }

      break
    }
    case 'HktTypeParam': {
      str += ` extends HKT${[0, 1].includes(param.size) ? '' : `${param.size}`}`

      break
    }
  }

  return str
}

function printArgument(arg: FunctionArgument): string {
  let str = ''

  switch (arg.tag) {
    case 'StaticArgument': {
      str += `${arg.label}: ${arg.type}`
      break
    }
    case 'KindNode': {
      str += `${arg.label}: ${printKindNode(arg)}`

      break
    }
    case 'DynamicArgument': {
      str += `${arg.label}: ${arg.template(...arg.typeParams.map((t) => t.label))}`

      break
    }
    case 'TypeClassArgument': {
      str += `${arg.label}: ${arg.typeClass}${arg.size === 0 ? '' : arg.size}<${arg.typeParams
        .map((param) => param.label)
        .join(', ')}>`

      break
    }
  }

  return str
}

function printKindNode(arg: KindNode) {
  let str = `Kind${[0, 1].includes(arg.size) ? '' : arg.size}<${arg.hkt.label}, `

  str += arg.params
    .map((p) =>
      p.tag === 'KindNode'
        ? printKindNode(p)
        : p.tag === 'FunctionSignature'
        ? printFunctionSignature(p, true)
        : p.tag === 'DynamicValue'
        ? printValue(p)
        : p.label,
    )
    .join(', ')

  return str + '>'
}

function printReturnSignature(signature: ReturnSignature): string {
  switch (signature.tag) {
    case 'StaticReturnSignature': {
      return signature.params.length > 0
        ? `${signature.type}<${signature.params.map((p) => p.label).join(', ')}>`
        : signature.type
    }
    case 'HktReturnSignature': {
      return `Kind${[0, 1].includes(signature.size) ? '' : signature.size}<${
        signature.type.label
      }, ${signature.params.map(printHktReturnSignatureParam).join(', ')}>`
    }
    case 'FunctionSignature':
      return printFunctionSignature(signature, true)
  }
}

function printHktReturnSignatureParam(param: HktReturnSignatureParam) {
  switch (param.tag) {
    case 'HktReturnSignature':
      return printReturnSignature(param)
    case 'RecordNode':
      return printRecordNode(param)
    case 'TupleNode':
      return printTupleNode(param)
    case 'DynamicValue':
      return printValue(param)
    default:
      return printTypeParam(param, false)
  }
}

function printTupleNode(node: TupleNode): string {
  return `readonly [${node.values.map((value) => printValue(value)).join(', ')}]`
}

function printRecordNode(node: RecordNode): string {
  if (node.keyParam) {
    return `{ readonly [${node.key} in ${node.keyOf ? 'keyof ' : ''}${printTypeParam(
      node.keyParam,
      false,
    )}]: ${printValue(node.value)} }`
  }

  return `{ readonly [key: ${node.key}]: ${printValue(node.value)} }`
}

function printValue(value: Value): string {
  switch (value.tag) {
    case 'DynamicValue':
      return printDynamicValue(value)
  }
}

function printDynamicValue<Params extends readonly TypeParam[]>(
  value: DynamicValue<Params>,
): string {
  return value.template(value.typeParams.map((t) => t.label))
}

function printInterfaceNode(node: InterfaceNode): string {
  if (node.params.length > 0) {
    return `export interface ${getInterfaceName(node)}<${node.params
      .map((param) => printTypeParam(param))
      .join(', ')
      .trim()}> {
${printInterfaceProperties(node.properties)}
}`
  }

  return `export interface ${node.name} {
${printInterfaceProperties(node.properties)}
}`
}

function getInterfaceName(node: InterfaceNode): string {
  const hktParams = node.params.filter((x): x is HktTypeParam => x.tag === 'HktTypeParam')

  return hktParams.length === 0
    ? node.name
    : `${node.name}${hktParams.map((p) => (p.size > 1 ? p.size : '')).join('')}`
}

function printInterfaceProperties(properties: InterfaceNode['properties']) {
  return properties
    .map(
      ([key, value]) =>
        `  readonly ${key}: ${
          value.tag === 'FunctionSignature'
            ? printFunctionSignature(value, true)
            : value.tag === 'KindNode'
            ? printKindNode(value)
            : printValue(value)
        }`,
    )
    .join('\n')
}

function getAdditionalParams(lengths: Map<symbol, number>, useDefaults: boolean, reverse: boolean) {
  const additionalParams: Map<symbol, readonly StaticTypeParam[]> = new Map()

  const setAdditional = (
    type: HktTypeParam,
    params: KindNode['params'],
    i: number,
    multiple: boolean,
    existing: number,
  ) => {
    if (!lengths.has(type.id)) {
      return
    }

    const size = lengths.get(type.id)!
    const satisfiedSize =
      params.filter((x): x is TypeParam | KindNode => x.tag !== 'HktTypeParam').length + existing

    const args = hktParamNames
      .slice(satisfiedSize, size)
      .map(
        (x) =>
          new StaticTypeParam(
            `${multiple ? `${x}${i + 1}` : x}`,
            useDefaults ? `= ${type.label}['defaults'][Params.${x}]` : undefined,
          ),
      )

    additionalParams.set(type.id, reverse ? args.reverse() : args)
  }

  return {
    additionalParams,
    setAdditional,
  } as const
}
