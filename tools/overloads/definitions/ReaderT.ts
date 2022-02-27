import {
  DynamicTypeParam,
  HKTParam,
  HKTPlaceholder,
  Interface,
  Kind,
  StaticTypeParam,
} from '../AST'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt)
export const resourcesTypeParam = new StaticTypeParam('Resources')
export const aTypeParam = new StaticTypeParam('A')

export const node = new Interface(
  'ReaderT',
  [hkt, resourcesTypeParam, placeholder, aTypeParam],
  [],
  [
    new DynamicTypeParam(
      [resourcesTypeParam, new Kind('', hkt, [placeholder, aTypeParam])],
      ([a, kind]) => `Reader<${a}, ${kind}>`,
    ),
  ],
)
