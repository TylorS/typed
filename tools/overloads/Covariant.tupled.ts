// export function tupled<F>(F: Functor<F>): <A>(fa: HKT<F, A>) => HKT<F, readonly [A]> {
//   return F.map(tuple)
// }

import {
  DynamicValue,
  FunctionSignature,
  HktReturnSignature,
  HktTypeParam,
  KindNode,
  StaticTypeParam,
  TupleNode,
  TypeClassArgument,
} from '../OverloadAst'

const fHkt = new HktTypeParam('F')
const functorFTypeClass = new TypeClassArgument('F', 'Functor', [fHkt])

const aTypeParam = new StaticTypeParam('A')
const kindArg = new KindNode('kind', fHkt, [aTypeParam])

export const node = new FunctionSignature(
  true,
  'tupled',
  [fHkt],
  [functorFTypeClass],
  new FunctionSignature(
    false,
    '',
    [aTypeParam],
    [kindArg],
    new HktReturnSignature(fHkt, [
      new TupleNode([new DynamicValue([aTypeParam], (s) => s.join(''))]),
    ]),
  ),
)
