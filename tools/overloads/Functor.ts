import {
  DynamicArgument,
  FunctionSignature,
  HktReturnSignature,
  HktTypeParam,
  InterfaceNode,
  KindNode,
  StaticTypeParam,
} from '../OverloadAst'

const hkt = new HktTypeParam('T')

const aParam = new StaticTypeParam('A')
const bParam = new StaticTypeParam('B')

const f = new DynamicArgument('f', [aParam, bParam], (a, b) => `Unary<${a}, ${b}>`)

const mapFunction = new FunctionSignature(
  false,
  '',
  [aParam, bParam],
  [f],
  new FunctionSignature(
    false,
    '',
    [],
    [new KindNode('kind', hkt, [aParam])],
    new HktReturnSignature(hkt, [bParam]),
  ),
)

export const node = new InterfaceNode('Functor', [hkt], [['map', mapFunction] as const])
