import { FlattenIntersection, ToConsList, UnNest } from './ConsList'

export type And<A extends readonly any[], Fallback = unknown> = UnNest<
  FlattenIntersection<ToConsList<A>, Fallback>,
  Fallback
>
