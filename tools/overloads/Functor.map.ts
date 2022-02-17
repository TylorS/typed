import {
  DynamicArgument,
  FunctionSignature,
  HktReturnSignature,
  HktTypeParam,
  KindNode,
  StaticTypeParam,
  TypeClassArgument,
} from '../FunctionSignature'

const functorFParam = new HktTypeParam('F')
const functorGParam = new HktTypeParam('G')

const functorFTypeClass = new TypeClassArgument('F', 'Functor', [functorFParam])
const functorGFTypeClass = new TypeClassArgument('G', 'Functor', [functorGParam])

const aTypeParam = new StaticTypeParam('A')
const bTypeParam = new StaticTypeParam('B')

export const signature = new FunctionSignature(
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
