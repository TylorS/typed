import { HKTParam, HKTPlaceholder, KindReturn, StaticTypeParam, TypeAlias } from '../AST'

export const hkt = new HKTParam('T')
export const placeholder = new HKTPlaceholder(hkt)
export const aTypeParam = new StaticTypeParam('A')

export const node = new TypeAlias(
  'OptionT',
  [hkt, placeholder, aTypeParam],
  new KindReturn(hkt, [placeholder, new StaticTypeParam(`Option<A>`)]),
)
