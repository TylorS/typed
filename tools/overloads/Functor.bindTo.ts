// export function bindTo<F>(
//   F: Functor<F>
// ): <N extends string>(name: N) => <A>(fa: HKT<F, A>) => HKT<F, { readonly [K in N]: A }> {
//   return (name) => (fa) => F.map(fa, (a) => ({ [name]: a } as any))
// }

import {
  DynamicValue,
  FunctionSignature,
  HktReturnSignature,
  HktTypeParam,
  KindNode,
  ObjectNode,
  StaticArgument,
  StaticTypeParam,
  TypeClassArgument,
} from '../FunctionSignature'

const fHkt = new HktTypeParam('F')
const functorFTypeClass = new TypeClassArgument('F', 'Functor', [fHkt])
const nameTypeParam = new StaticTypeParam('N', 'string')
const nameArg = new StaticArgument('name', 'N')

const aParam = new StaticTypeParam('A')
const kindArg = new KindNode('kind', fHkt, [aParam])

const returnObject = new ObjectNode(
  'K',
  new DynamicValue([aParam], (x) => x.join('')),
  nameTypeParam,
  false,
)

export const signature = new FunctionSignature(
  true,
  'bindTo',
  [fHkt],
  [functorFTypeClass],
  new FunctionSignature(
    false,
    '',
    [nameTypeParam],
    [nameArg],
    new FunctionSignature(
      false,
      '',
      [aParam],
      [kindArg],
      new HktReturnSignature(fHkt, [returnObject]),
    ),
  ),
)
