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

const f = new DynamicArgument('value', [aParam], (a) => a)

const make = new FunctionSignature(
  false,
  '',
  [aParam],
  [f],
  new HktReturnSignature(hkt, [aParam]),
  true,
)

export const node = new InterfaceNode('Pointed', [hkt], [['of', make] as const])
