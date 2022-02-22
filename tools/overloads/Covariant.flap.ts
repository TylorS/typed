// export function flap<F>(F: Functor<F>): <A>(a: A) => <B>(fab: HKT<F, (a: A) => B>) => HKT<F, B> {
//   return (a) => (fab) => F.map(fab, (f) => f(a))
// }

import {
  FunctionSignature,
  HktReturnSignature,
  HktTypeParam,
  KindNode,
  StaticArgument,
  StaticReturnSignature,
  StaticTypeParam,
  TypeClassArgument,
} from '../OverloadAst'

const fHkt = new HktTypeParam('F')

const functorFTypeClass = new TypeClassArgument('F', 'Functor', [fHkt])

const aTypeParam = new StaticTypeParam('A')
const aArg = new StaticArgument('a', 'A')

const bTypeParam = new StaticTypeParam('B')

const hktAB = new KindNode('kind', fHkt, [
  new FunctionSignature(false, '', [], [aArg], new StaticReturnSignature('B', [])),
])

export const node = new FunctionSignature(
  true,
  'flap',
  [fHkt],
  [functorFTypeClass],
  new FunctionSignature(
    false,
    '',
    [aTypeParam],
    [aArg],
    new FunctionSignature(
      false,
      '',
      [bTypeParam],
      [hktAB],
      new HktReturnSignature(fHkt, [bTypeParam]),
    ),
  ),
)
