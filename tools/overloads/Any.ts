import {
  DynamicValue,
  FunctionSignature,
  HktReturnSignature,
  HktTypeParam,
  InterfaceNode,
  KindNode,
} from '../OverloadAst'

const hkt = new HktTypeParam('T')

export const node = new InterfaceNode(
  'Any',
  [hkt],
  [
    [
      'any',
      new FunctionSignature(
        false,
        '',
        [],
        [],
        new HktReturnSignature(hkt, [new DynamicValue([], () => 'unknown')]),
        false,
        true,
      ),
    ],
  ],
)
