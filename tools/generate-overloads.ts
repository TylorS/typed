import { DeepEquals } from '../src/Eq'

const hktParamNames = ['A', 'E', 'R', 'S', 'U', 'V', 'W', 'X', 'Y', 'Z'] as const

const possibleLengths: ReadonlyArray<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
type PossibleLength = typeof possibleLengths[number]

export type TypeParam = StaticTypeParam | HktTypeParam

export class StaticTypeParam {
  readonly tag = 'StaticTypeParam'
  readonly id = Symbol('StaticTypeParam')

  constructor(readonly label: string, readonly extension?: string) {}
}

export class HktTypeParam {
  readonly tag = 'HktTypeParam'
  readonly id = Symbol('HktTypeParam')

  constructor(readonly label: string, readonly size: PossibleLength = 1) {}
}

export type FunctionArgument =
  | StaticArgument
  | TypeClassArgument
  | DynamicArgument<readonly TypeParam[]>
  | KindNode

export class StaticArgument {
  readonly tag = 'StaticArgument'
  readonly id = Symbol('StaticArgument')

  constructor(readonly label: string, readonly type: string) {}
}

export class TypeClassArgument {
  readonly tag = 'TypeClassArgument'
  readonly id = Symbol('TypeClassArgument')

  constructor(
    readonly label: string,
    readonly typeClass: string,
    readonly typeParams: readonly TypeParam[],
    readonly size: number = 1,
  ) {}
}

export class KindNode {
  readonly tag = 'KindNode'
  readonly id = Symbol('KindNode')

  constructor(
    readonly label: string,
    readonly hkt: HktTypeParam,
    readonly params: ReadonlyArray<TypeParam | KindNode>,
    readonly size: number = 1,
  ) {}
}

export class DynamicArgument<Params extends readonly TypeParam[]> {
  readonly tag = 'DynamicArgument'
  readonly id = Symbol('DynamicArgument')

  constructor(
    readonly label: string,
    readonly typeParams: Params,
    readonly template: (...params: { [K in keyof Params]: string }) => string,
  ) {}
}

export class StaticReturnSignature {
  readonly tag = 'StaticReturnSignature'
  readonly id = Symbol('StaticReturnSignature')

  constructor(readonly type: string, readonly params: readonly TypeParam[]) {}
}

export class HktReturnSignature {
  readonly tag = 'HktReturnSignature'
  readonly id = Symbol('HktReturnSignature')

  constructor(
    readonly type: HktTypeParam,
    readonly params: ReadonlyArray<TypeParam | HktReturnSignature>,
    readonly size: number = 1,
  ) {}
}

export type ReturnSignature = StaticReturnSignature | HktReturnSignature | FunctionSignature

export class FunctionSignature {
  readonly tag = 'FunctionSignature'
  readonly id = Symbol('FunctionSignature')

  constructor(
    readonly exported: boolean,
    readonly name: string,
    readonly params: readonly TypeParam[],
    readonly args: readonly FunctionArgument[],
    readonly returnSignature: ReturnSignature,
  ) {}
}

const functorFParam = new HktTypeParam('F')
const functorGParam = new HktTypeParam('G')

const functorFTypeClass = new TypeClassArgument('F', 'Functor', [functorFParam])
const functorGFTypeClass = new TypeClassArgument('G', 'Functor', [functorGParam])

const aTypeParam = new StaticTypeParam('A')
const bTypeParam = new StaticTypeParam('B')

const signature = new FunctionSignature(
  true,
  'map',
  [functorFParam, functorGParam],
  [functorFTypeClass, functorGFTypeClass],
  new FunctionSignature(
    false,
    '',
    [aTypeParam, bTypeParam],
    [new DynamicArgument('f', [aTypeParam, bTypeParam] as const, (a, b) => `Unary<${a}, ${b}>`)],
    new FunctionSignature(
      false,
      '',
      [],
      [new KindNode('kind', functorFParam, [new KindNode('', functorGParam, [aTypeParam])])],
      new HktReturnSignature(functorFParam, [new HktReturnSignature(functorGParam, [bTypeParam])]),
    ),
  ),
)

console.log(
  generateSignatures(signature)
    .map((s) => printSignature(s))
    .join('\n'),
)

function generateSignatures(signature: FunctionSignature) {
  const hktParams = signature.params.filter((x): x is HktTypeParam => x.tag === 'HktTypeParam')
  const possiblilties = uniq(combinations<number>(hktParams.map(() => possibleLengths)))

  return possiblilties.map((possibility) => rewriteSignature(signature, possibility))
}

function uniq<A>(array: ReadonlyArray<A>): ReadonlyArray<A> {
  const seen: A[] = []
  const unique: A[] = []

  for (const value of array) {
    const hasBeenSeen = !!seen.find(DeepEquals.equals(value))

    if (!hasBeenSeen) {
      seen.push(value)
      unique.push(value)
    }
  }

  return unique
}

function rewriteSignature(
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

  const additionalParams: Map<symbol, readonly StaticTypeParam[]> = new Map()

  kindNodes.forEach((node, i) => {
    const size = lengths.get(node.hkt.id)!
    const satisfiedSize = node.params.filter(
      (x): x is TypeParam | KindNode => x.tag !== 'HktTypeParam',
    ).length

    const args = hktParamNames
      .slice(satisfiedSize, size)
      .reverse()
      .map((x) => (kindNodes.length === 1 ? x : `${x}${i + 1}`))
      .map((s) => new StaticTypeParam(s))

    additionalParams.set(node.hkt.id, args)
  })

  const args = signature.args.map((x) => {
    switch (x.tag) {
      case 'KindNode':
        return rewriteKindNode(x, lengths, additionalParams)
      case 'TypeClassArgument':
        return rewriteTypeClassArgument(x, lengths)
      default:
        return x
    }
  })

  const returnSignature = rewriteReturnSignature(
    signature.returnSignature,
    lengths,
    additionalParams,
  )

  return {
    ...signature,
    params: [...Array.from(additionalParams.values()).flat(), ...params],
    args,
    returnSignature,
  }
}

function rewriteKindNode(
  x: KindNode,
  lengths: Map<symbol, number>,
  additionalParams: Map<symbol, readonly StaticTypeParam[]>,
): KindNode {
  return addAdditionalKindNodeParams(
    {
      ...x,
      params: x.params.map((y) =>
        y.tag === 'KindNode' ? rewriteKindNode(y, lengths, additionalParams) : y,
      ),
      size: lengths.get(x.hkt.id)!,
    },
    additionalParams,
  )
}

function addAdditionalKindNodeParams(
  x: KindNode,
  additionalParams: Map<symbol, readonly StaticTypeParam[]>,
): KindNode {
  return {
    ...x,
    params: [...(additionalParams.get(x.hkt.id) ?? []), ...x.params],
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
  lengths: Map<symbol, number>,
  additionalParams: Map<symbol, readonly StaticTypeParam[]>,
): ReturnSignature {
  switch (signature.tag) {
    case 'FunctionSignature':
      return rewriteSignature(signature, [], lengths)
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

  if (options.length === 1) {
    return options
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

function printSignature(signature: FunctionSignature, isReturn = false) {
  let str = ''

  if (!isReturn && signature.exported) {
    str += 'export '
  }

  if (!isReturn) {
    str += 'function '
  }

  str += `${signature.name}`

  str += signature.params.length === 0 ? '' : `<${signature.params.map(printTypeParam).join(', ')}>`

  str += '('

  str += signature.args.map((arg) => printArgument(arg)).join(', ')

  str += `)${!isReturn && signature.returnSignature.tag === 'FunctionSignature' ? ':' : ' =>'} `

  str += printReturnSignature(signature.returnSignature)

  return str
}

function printTypeParam(param: TypeParam): string {
  let str = ''

  str += param.label

  switch (param.tag) {
    case 'StaticTypeParam': {
      if (param.extension) {
        str += ` extends ${param.extension}`
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
      str += `${arg.label}: ${printKindArgument(arg)}`

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

function printKindArgument(arg: KindNode) {
  let str = `Kind${[0, 1].includes(arg.size) ? '' : arg.size}<${arg.hkt.label}, `

  str += arg.params.map((p) => (p.tag === 'KindNode' ? printKindArgument(p) : p.label)).join(', ')

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
      }, ${signature.params
        .map((x) => (x.tag === 'HktReturnSignature' ? printReturnSignature(x) : printTypeParam(x)))
        .join(', ')}>`
    }
    case 'FunctionSignature':
      return printSignature(signature, true)
  }
}
